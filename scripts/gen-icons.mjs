// Genera el juego de favicons de Mudanzas X a partir de la X del logo.
// Marca: X en BLANCO sobre fondo NEGRO, para que el icono sea siempre visible
// (pestañas claras/oscuras, historial, pantalla de inicio). No requiere red.
//
// Salida:
//   src/app/icon.svg          -> favicon SVG (fondo negro redondeado, X blanca)
//   src/app/favicon.ico       -> ICO multi-tamaño (16/32/48) para la pestaña
//   src/app/apple-icon.png    -> apple-touch-icon 180x180 (iOS)
//   public/icon-192.png       -> PWA / Android
//   public/icon-512.png       -> PWA / Android
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Trazado de la X del logo, en viewBox 512x512.
const X_PATH =
  "M74.9803 74.9809L256 210.745L512 0L353.783 256L437.019 437.02L256 301.255L0 512L158.217 256L74.9803 74.9809Z";

// SVG base: fondo negro (opcionalmente redondeado) con la X blanca centrada y
// reducida para dejar un margen de seguridad (queda bien tras el enmascarado de
// iOS/Android y no toca los bordes).
function baseSvg({ rounded, scale }) {
  const bg = rounded
    ? `<rect width="512" height="512" rx="112" fill="#000000"/>`
    : `<rect width="512" height="512" fill="#000000"/>`;
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
${bg}
<g transform="translate(256,256) scale(${scale}) translate(-256,-256)">
<path d="${X_PATH}" fill="#FFFFFF"/>
</g>
</svg>`;
}

const roundedSvg = baseSvg({ rounded: true, scale: 0.6 }); // pestaña / SVG
const squareSvg = baseSvg({ rounded: false, scale: 0.58 }); // instalable (maskable)

function png(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

// Empaqueta varios PNG en un .ico (los navegadores modernos aceptan PNG dentro
// del contenedor ICO). Estructura: ICONDIR + N x ICONDIRENTRY + datos PNG.
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: icono
  header.writeUInt16LE(count, 4);

  const entries = [];
  const datas = [];
  let offset = 6 + count * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // ancho (0 => 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // alto
    entry.writeUInt8(0, 2); // paleta
    entry.writeUInt8(0, 3); // reservado
    entry.writeUInt16LE(1, 4); // planos
    entry.writeUInt16LE(32, 6); // bits por pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
    datas.push(data);
  }
  return Buffer.concat([header, ...entries, ...datas]);
}

// SVG servido tal cual (nítido a cualquier tamaño).
await writeFile(join(ROOT, "src/app/icon.svg"), roundedSvg, "utf8");

// favicon.ico multi-tamaño (16/32/48) desde el SVG redondeado.
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await png(roundedSvg, size) })),
);
await writeFile(join(ROOT, "src/app/favicon.ico"), buildIco(icoImages));

// apple-touch-icon 180x180 y PNGs de PWA (cuadrados, full-bleed negro).
await writeFile(join(ROOT, "src/app/apple-icon.png"), await png(squareSvg, 180));
await writeFile(join(ROOT, "public/icon-192.png"), await png(squareSvg, 192));
await writeFile(join(ROOT, "public/icon-512.png"), await png(squareSvg, 512));

// Imagen social (Open Graph) 1200x630: logotipo blanco centrado sobre negro.
const logo = await sharp(join(ROOT, "public/logo-white.svg"))
  .resize({ width: 760 })
  .png()
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#000000" },
})
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(join(ROOT, "public/og.png"));

console.log("Iconos generados:");
console.log("  src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png");
console.log("  public/icon-192.png, public/icon-512.png, public/og.png");
