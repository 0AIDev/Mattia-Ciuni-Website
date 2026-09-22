// Genera la freccia minimale usata nelle mail di conferma feedback.
//
// Perché un PNG e non un SVG inline: Gmail e diversi client di posta
// eliminano gli SVG, quindi la freccia sparirebbe proprio dove serve.
// Il disegno è vettoriale (distanza punto-segmento con antialiasing per
// campionamento) e viene codificato a mano: nessuna dipendenza esterna.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const SIZE = 48; // lato del PNG in pixel
const SS = 4; // campioni per asse, per i bordi morbidi
const INK = [22, 22, 22]; // #161616, lo stesso inchiostro del sito
const STROKE = 5; // spessore del tratto

// Distanza fra il punto (px, py) e il segmento (ax, ay)-(bx, by).
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Fusto orizzontale + due tratti che formano la punta.
const SEGMENTS = [
  [9, 24, 31, 24],
  [24, 17, 33, 24],
  [24, 31, 33, 24],
];

function coverage(x, y) {
  let hits = 0;
  for (let sy = 0; sy < SS; sy += 1) {
    for (let sx = 0; sx < SS; sx += 1) {
      const px = x + (sx + 0.5) / SS;
      const py = y + (sy + 0.5) / SS;
      const inside = SEGMENTS.some(
        ([ax, ay, bx, by]) => distanceToSegment(px, py, ax, ay, bx, by) <= STROKE / 2,
      );
      if (inside) hits += 1;
    }
  }
  return hits / (SS * SS);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "none"
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const alpha = new Float32Array(SIZE * SIZE);
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    alpha[y * SIZE + x] = coverage(x, y);
  }
}

// Ritaglio: la freccia occupa solo una parte del canvas, e in mail va
// mostrata piccola. Senza crop, a 10px il tratto si perde.
let minX = SIZE;
let minY = SIZE;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    if (alpha[y * SIZE + x] <= 0.01) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}

const PAD = 1;
minX = Math.max(0, minX - PAD);
minY = Math.max(0, minY - PAD);
maxX = Math.min(SIZE - 1, maxX + PAD);
maxY = Math.min(SIZE - 1, maxY + PAD);
const width = maxX - minX + 1;
const height = maxY - minY + 1;

const rgba = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4;
    rgba[offset] = INK[0];
    rgba[offset + 1] = INK[1];
    rgba[offset + 2] = INK[2];
    rgba[offset + 3] = Math.round(alpha[(y + minY) * SIZE + (x + minX)] * 255);
  }
}

const out = process.argv[2] ?? "public/mail-arrow.png";
writeFileSync(out, encodePng(width, height, rgba));
console.log(
  `Scritto ${out} (${width}x${height}, freccia #161616 su trasparente)`,
);
