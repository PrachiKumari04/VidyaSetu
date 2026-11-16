const Tesseract = require('tesseract.js');

/**
 * Tesseract.js local offline OCR fallback
 */
async function extractFromImageTesseract(base64Image, mediaType) {
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  const worker = await Tesseract.createWorker('eng');
  const { data: { text } } = await worker.recognize(imageBuffer);
  await worker.terminate();

  if (!text || !text.trim()) {
    return [];
  }

  // Parse lines from raw extracted OCR text
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2)
    .filter(line => !/^(rx|dr\.|patient|date|signature|age|sex|name|address)/i.test(line));

  return lines;
}

module.exports = { extractFromImageTesseract };
