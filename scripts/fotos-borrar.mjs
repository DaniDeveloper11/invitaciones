#!/usr/bin/env node
// Borra las fotos de invitados de un evento: archivos en R2 y filas en D1.
//
//   npm run fotos:borrar -- boda-ana-y-luis                 (fotos + evento)
//   npm run fotos:borrar -- boda-ana-y-luis --solo-fotos    (conserva el evento)
//   npm run fotos:borrar -- boda-ana-y-luis --simular       (sólo muestra qué borraría)
//   npm run fotos:borrar -- demo --local                    (base de `wrangler dev`)
//
// Pide escribir el slug para confirmar (o --si para no preguntar). Borra
// primero R2 y después D1: si algo falla a medias, el evento sigue en D1 y
// basta con volver a correrlo. No toca el sitio de Pages ni Terraform.
//
// Con --solo-fotos el evento queda dado de alta con el mismo código, QR y
// enlace de festejados (útil para limpiar fotos de prueba antes del evento).
//
// En remoto usa CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID; si no están en
// la terminal, los lee de terraform/.env.local.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BUCKET = "invitaciones-fotos";
const EN_PARALELO = 8;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workerDir = path.join(root, "workers", "fotos");
const wranglerBin = path.join(workerDir, "node_modules", ".bin", "wrangler");

// ── Argumentos ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const bandera = (nombre) => args.includes(`--${nombre}`);
const slug = args.find((a) => !a.startsWith("--"));
const local = bandera("local");
const soloFotos = bandera("solo-fotos");
const simular = bandera("simular");

function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  salir(
    "Uso: npm run fotos:borrar -- <slug> [--solo-fotos] [--simular] [--si] [--local]",
  );
}
if (!existsSync(wranglerBin)) {
  salir(
    "Falta wrangler. Instálalo una vez con:  npm install --prefix workers/fotos",
  );
}

// ── Credenciales (sólo remoto) ──────────────────────────────────────────────

if (!local) {
  const envLocal = path.join(root, "terraform", ".env.local");
  if (existsSync(envLocal)) {
    for (const [, clave, valor] of readFileSync(envLocal, "utf8").matchAll(
      /^\s*(?:export\s+)?(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)\s*=\s*"?([^"\n]*)"?/gm,
    )) {
      process.env[clave] ||= valor;
    }
  }
  for (const clave of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
    if (!process.env[clave])
      salir(`Falta ${clave} (en la terminal o en terraform/.env.local).`);
  }
}

// ── D1 ──────────────────────────────────────────────────────────────────────

const sql = (v) => `'${String(v).replaceAll("'", "''")}'`;

function wrangler(argumentos) {
  try {
    return execFileSync(wranglerBin, argumentos, {
      cwd: workerDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    salir(
      `wrangler ${argumentos.slice(0, 3).join(" ")} falló:\n${err.stderr || err.stdout || err.message}`,
    );
  }
}

function d1(comando) {
  const salida = wrangler([
    "d1",
    "execute",
    "invitaciones",
    local ? "--local" : "--remote",
    "--json",
    "--command",
    comando,
  ]);
  return JSON.parse(salida)[0]?.results ?? [];
}

// ── R2 ──────────────────────────────────────────────────────────────────────

const apiR2 = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET}/objects`;

async function cloudflare(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
  });
  const cuerpo = await res.json().catch(() => null);
  if (!res.ok || cuerpo?.success === false) {
    const detalle =
      cuerpo?.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(`API de Cloudflare ${res.status}: ${detalle}`);
  }
  return cuerpo;
}

/** Todos los archivos bajo <slug>/ en R2 remoto: [{ key, size }]. */
async function listarRemoto() {
  const objetos = [];
  let cursor;
  do {
    const url = new URL(apiR2);
    url.searchParams.set("prefix", `${slug}/`);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const { result, result_info: info } = await cloudflare(url);
    objetos.push(...result.map(({ key, size }) => ({ key, size })));
    cursor = info?.is_truncated ? info.cursor : undefined;
  } while (cursor);
  return objetos;
}

/** Ejecuta `tarea` sobre cada elemento, `EN_PARALELO` a la vez. */
async function enParalelo(elementos, tarea) {
  let siguiente = 0;
  let hechos = 0;
  const trabajador = async () => {
    while (siguiente < elementos.length) {
      await tarea(elementos[siguiente++]);
      hechos++;
      if (hechos % 50 === 0 || hechos === elementos.length) {
        process.stdout.write(
          `\r  R2: ${hechos}/${elementos.length} archivos borrados`,
        );
      }
    }
  };
  await Promise.all(Array.from({ length: EN_PARALELO }, trabajador));
  if (elementos.length) process.stdout.write("\n");
}

const borrarRemoto = (key) =>
  cloudflare(`${apiR2}/${encodeURIComponent(key)}`, { method: "DELETE" });

// En local no hay API para listar por carpeta: las llaves salen de D1.
const borrarLocal = async (key) => {
  wrangler(["r2", "object", "delete", `${BUCKET}/${key}`, "--local"]);
};

// ── Resumen y confirmación ──────────────────────────────────────────────────

const [evento] = d1(
  `SELECT slug, nombre FROM eventos WHERE slug = ${sql(slug)}`,
);
const fotos = d1(`SELECT id FROM fotos WHERE slug = ${sql(slug)}`);

let archivos;
if (local) {
  archivos = fotos
    .flatMap(({ id }) => [`${slug}/${id}`, `${slug}/${id}.thumb`])
    .map((key) => ({ key }));
} else {
  try {
    archivos = await listarRemoto();
  } catch (err) {
    salir(`No se pudo listar R2: ${err.message}`);
  }
}

if (!evento && !fotos.length && !archivos.length) {
  salir(
    `No hay nada de ${slug} en ${local ? "la base LOCAL" : "D1 ni en R2"}.`,
  );
}

const mb =
  archivos.reduce((total, a) => total + (a.size ?? 0), 0) / 1024 / 1024;
console.log(`
  Evento:  ${slug}${evento ? ` — "${evento.nombre}"` : "  (no está dado de alta)"}${local ? "  (base LOCAL)" : ""}
  Fotos en D1:  ${fotos.length}
  Archivos en R2 (${slug}/):  ${archivos.length}${local ? "" : `  (~${mb.toFixed(1)} MB)`}
  Se borra:  ${soloFotos ? "sólo las fotos (el evento, su código y su QR se conservan)" : "las fotos y el evento"}
`);

if (simular) {
  console.log("  --simular: no se borró nada.");
  process.exit(0);
}

if (!bandera("si")) {
  if (!process.stdin.isTTY)
    salir("Sin terminal interactiva: confirma con --si.");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = (
    await rl.question(
      `  Esto no se puede deshacer. Escribe "${slug}" para confirmar: `,
    )
  ).trim();
  rl.close();
  if (respuesta !== slug) salir("\n  No coincide: no se borró nada.");
}

// ── Borrado: R2 primero, D1 al final ────────────────────────────────────────

try {
  await enParalelo(
    archivos.map((a) => a.key),
    local ? borrarLocal : borrarRemoto,
  );
} catch (err) {
  salir(
    `\n  Falló el borrado en R2 (D1 no se tocó; vuelve a correr el comando): ${err.message}`,
  );
}

d1(`DELETE FROM fotos WHERE slug = ${sql(slug)}`);
if (!soloFotos) d1(`DELETE FROM eventos WHERE slug = ${sql(slug)}`);

console.log(`
✓ ${soloFotos ? "Fotos borradas" : "Evento y fotos borrados"}: ${slug}${local ? "  (base LOCAL)" : ""}
${
  soloFotos
    ? ""
    : `
  Si también vas a dar de baja la invitación:
    1. Quita su entrada de terraform/sites.tf y corre terraform apply.
    2. git rm -r sites/${slug}  y commit + push.
`
}`);
