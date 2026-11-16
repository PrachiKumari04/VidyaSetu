const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini 2.5 Flash Multimodal OCR for Indian Prescriptions
 */
async function extractFromImageGemini(base64Image, mediaType) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('No GEMINI_API_KEY available for Gemini Vision OCR');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert clinical medical OCR assistant specializing in reading Indian doctor prescriptions, handwritten notes, and medical lab reports.
Task: Extract all medicine brand names, generic names, dosages (e.g., 500mg, 5ml), and frequency instructions visible in this image.

Instructions:
1. Return ONLY a valid JSON array of strings containing extracted medicines.
2. Example format: ["Paracetamol 500mg", "Amoxicillin 250mg", "Pantoprazole 40mg"]
3. If handwriting is difficult, make your best professional clinical estimate.
4. Do not include markdown code blocks, intro, or explanatory text.`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mediaType || 'image/jpeg'
    }
  };

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text().trim();

  // Clean JSON output
  const cleanedJsonStr = responseText.replace(/^```json\s*|^```\s*|```$/g, '').trim();

  try {
    const parsed = JSON.parse(cleanedJsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map(item => typeof item === 'string' ? item : (item.name || item.medicine || JSON.stringify(item)));
    }
    if (typeof parsed === 'object') {
      const list = parsed.medicines || parsed.list || parsed.names || Object.values(parsed).find(Array.isArray);
      if (list && Array.isArray(list)) {
        return list.map(item => typeof item === 'string' ? item : (item.name || JSON.stringify(item)));
      }
    }
    return [cleanedJsonStr];
  } catch (e) {
    // Regex fallback to extract bracketed array
    const match = responseText.match(/\[.*\]/s);
    if (match) {
      return JSON.parse(match[0]);
    }
    // Return line-by-line fallback
    return responseText.split('\n').map(l => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean);
  }
}

module.exports = { extractFromImageGemini };
