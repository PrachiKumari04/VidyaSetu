const { extractFromImageGemini } = require('./geminiVision');
const { extractFromImageGroq } = require('./groqVision');
const { extractFromImageTesseract } = require('./tesseractOcr');

/**
 * visionOcr Service - Cascades through 3 OCR Engines for maximum reliability
 * 1. Gemini 2.5 Flash Multimodal Vision
 * 2. Groq AI Vision / Extraction
 * 3. Local Tesseract.js Offline OCR
 */
async function extractFromImage(base64Image, mediaType) {
  // Tier 1: Gemini 2.5 Flash Multimodal Vision
  try {
    console.log('[visionOcr] Tier 1: Attempting Gemini 2.5 Flash Multimodal OCR...');
    const medicines = await extractFromImageGemini(base64Image, mediaType);
    if (medicines && medicines.length > 0) {
      console.log(`[visionOcr] Tier 1 Success: Found ${medicines.length} medicines via Gemini 2.5 Flash`);
      return {
        status: 'success',
        medicines: medicines,
        method: 'Gemini-2.5-Flash-Vision',
        warning: null
      };
    }
  } catch (err) {
    console.warn('[visionOcr] Tier 1 (Gemini) failed:', err.message);
  }

  // Tier 2: Groq AI Vision
  try {
    console.log('[visionOcr] Tier 2: Attempting Groq Vision OCR...');
    const medicines = await extractFromImageGroq(base64Image, mediaType);
    if (medicines && medicines.length > 0) {
      console.log(`[visionOcr] Tier 2 Success: Found ${medicines.length} medicines via Groq`);
      return {
        status: 'success',
        medicines: medicines,
        method: 'Groq-Vision',
        warning: null
      };
    }
  } catch (err) {
    console.warn('[visionOcr] Tier 2 (Groq) failed:', err.message);
  }

  // Tier 3: Local Tesseract.js Offline OCR Fallback
  try {
    console.log('[visionOcr] Tier 3: Attempting Local Tesseract.js Offline OCR...');
    const medicines = await extractFromImageTesseract(base64Image, mediaType);
    console.log(`[visionOcr] Tier 3 Complete: Extracted ${medicines.length} text lines via Tesseract.js`);
    return {
      status: 'success',
      medicines: medicines.length > 0 ? medicines : ['Unrecognized prescription text'],
      method: 'Tesseract-Offline-OCR',
      warning: 'Extracted via offline OCR fallback. Please verify medicine names.'
    };
  } catch (err) {
    console.error('[visionOcr] Tier 3 (Tesseract) failed:', err.message);
    throw new Error('Medicine extraction failed across all vision and OCR engines.');
  }
}

module.exports = { extractFromImage };
