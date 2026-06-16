// public/data/monster-icons/<No>.png を WebP に変換して同じディレクトリに <No>.webp を出力する。
// 既に .webp があるものはスキップする。新しいアイコンを取得したら再実行すること。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(scriptDir, '..', 'public', 'data', 'monster-icons');

const pngFiles = fs.readdirSync(iconsDir).filter((file) => file.endsWith('.png'));

let converted = 0;
let skipped = 0;

await Promise.all(
  pngFiles.map(async (pngFile) => {
    const webpFile = pngFile.replace(/\.png$/, '.webp');
    const webpPath = path.join(iconsDir, webpFile);
    if (fs.existsSync(webpPath)) {
      skipped += 1;
      return;
    }
    await sharp(path.join(iconsDir, pngFile)).webp({ quality: 82 }).toFile(webpPath);
    converted += 1;
  }),
);

console.error(`webp icons: converted ${converted}, skipped ${skipped}`);
