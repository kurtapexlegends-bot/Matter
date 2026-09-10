const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function makeCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = Buffer.alloc(4 + len);
  typeAndData.write(type, 0, 4, 'ascii');
  data.copy(typeAndData, 4);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generateMatterPng(width, height) {
  const scanlines = [];
  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.45;

  for (let y = 0; y < height; y++) {
    scanlines.push(0); // Filter type: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Squircle background with rounded corners
      const cornerR = width * 0.22;
      const qx = Math.max(Math.abs(dx) - (cx - cornerR), 0);
      const qy = Math.max(Math.abs(dy) - (cy - cornerR), 0);
      const cornerDist = Math.sqrt(qx * qx + qy * qy);
      const isInsideCard = cornerDist <= cornerR;

      if (!isInsideCard) {
        // Transparent
        scanlines.push(0, 0, 0, 0);
        continue;
      }

      // Base obsidian background
      let r = 8;
      let g = 10;
      let b = 15;
      let a = 255;

      // Subtle atmospheric core glow
      if (dist < width * 0.35) {
        const factor = 1 - dist / (width * 0.35);
        r = Math.min(255, Math.floor(r + 99 * factor * 0.4));
        g = Math.min(255, Math.floor(g + 102 * factor * 0.3));
        b = Math.min(255, Math.floor(b + 241 * factor * 0.5));
      }

      // Orbital ellipse 1 (rotate -30 deg)
      const rad1 = -30 * (Math.PI / 180);
      const x1 = dx * Math.cos(rad1) - dy * Math.sin(rad1);
      const y1 = dx * Math.sin(rad1) + dy * Math.cos(rad1);
      const eDist1 = Math.abs(Math.sqrt((x1 / (width * 0.38)) ** 2 + (y1 / (height * 0.16)) ** 2) - 1.0);

      // Orbital ellipse 2 (rotate +30 deg)
      const rad2 = 30 * (Math.PI / 180);
      const x2 = dx * Math.cos(rad2) - dy * Math.sin(rad2);
      const y2 = dx * Math.sin(rad2) + dy * Math.cos(rad2);
      const eDist2 = Math.abs(Math.sqrt((x2 / (width * 0.38)) ** 2 + (y2 / (height * 0.16)) ** 2) - 1.0);

      // Orbital ellipse 3 (vertical)
      const eDist3 = Math.abs(Math.sqrt((dx / (width * 0.16)) ** 2 + (dy / (height * 0.38)) ** 2) - 1.0);

      const ringWidth = 0.045;
      if (eDist1 < ringWidth) {
        const intensity = 1 - eDist1 / ringWidth;
        r = Math.min(255, Math.floor(r + 99 * intensity));
        g = Math.min(255, Math.floor(g + 102 * intensity));
        b = Math.min(255, Math.floor(b + 241 * intensity));
      }
      if (eDist2 < ringWidth) {
        const intensity = 1 - eDist2 / ringWidth;
        r = Math.min(255, Math.floor(r + 139 * intensity));
        g = Math.min(255, Math.floor(g + 92 * intensity));
        b = Math.min(255, Math.floor(b + 246 * intensity));
      }
      if (eDist3 < ringWidth) {
        const intensity = 1 - eDist3 / ringWidth;
        r = Math.min(255, Math.floor(r + 6 * intensity));
        g = Math.min(255, Math.floor(g + 182 * intensity));
        b = Math.min(255, Math.floor(b + 212 * intensity));
      }

      // Center nucleus
      if (dist < width * 0.085) {
        const intensity = 1 - dist / (width * 0.085);
        r = Math.min(255, Math.floor(99 + 156 * intensity));
        g = Math.min(255, Math.floor(102 + 153 * intensity));
        b = Math.min(255, 255);
      }

      scanlines.push(r, g, b, a);
    }
  }

  const rawData = Buffer.from(scanlines);
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Convert PNG to Windows ICO format
function makeIco(pngBuffer) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Number of images = 1

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0); // Width (0 means 256)
  dirEntry.writeUInt8(0, 1); // Height (0 means 256)
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  dirEntry.writeUInt32LE(22, 12); // Offset to image data (6 header + 16 entry)

  return Buffer.concat([icoHeader, dirEntry, pngBuffer]);
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log('[Matter] Generating 256x256 app icons...');
const png256 = generateMatterPng(256, 256);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), png256);

const ico = makeIco(png256);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), ico);

console.log('[Matter] Generated icon.png and icon.ico successfully in electron/assets/');
