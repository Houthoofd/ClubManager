import express from 'express';
import request from 'supertest';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const upload = multer({
  dest: './test-uploads',
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Handler called');
  console.log('File:', req.file);
  res.json({ success: true, file: req.file });
});

// Create test file
const testFile = path.join(__dirname, 'test.txt');
fs.writeFileSync(testFile, 'Hello World');

// Test
const response = await request(app)
  .post('/upload')
  .attach('file', testFile);

console.log('Status:', response.status);
console.log('Body:', response.body);

// Cleanup
fs.unlinkSync(testFile);
if (response.body.file) {
  fs.unlinkSync(response.body.file.path);
}

console.log('Test completed successfully!');
