const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/extracted_videos/home.mp4');

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const stats = fs.statSync(filePath);
console.log('File size (bytes):', stats.size);

const buffer = Buffer.alloc(100);
const fd = fs.openSync(filePath, 'r');
fs.readSync(fd, buffer, 0, 100, 0);
fs.closeSync(fd);

console.log('First 100 bytes (HEX):');
console.log(buffer.toString('hex'));

console.log('\nFirst 100 bytes (ASCII/UTF-8):');
console.log(buffer.toString('utf8'));
