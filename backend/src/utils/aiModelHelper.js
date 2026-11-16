const { Groq } = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const DEFAULT_MODELS = [
  process.env.GROQ_MODEL,
  'groq/compound',
  'groq/compound-mini',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b'
].filter(Boolean);

async function callGroqChat(options) {
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const { model, ...restOptions } = options;
  const candidateModels = model 
    ? [model, ...DEFAULT_MODELS.filter(m => m !== model)]
    : DEFAULT_MODELS;

  let lastError;
  for (const m of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        ...restOptions,
        model: m
      });
      return completion;
    } catch (err) {
      console.warn(`[Groq AI] Model '${m}' failed (${err.status || err.message}), trying next fallback...`);
      lastError = err;
    }
  }

  throw lastError;
}

module.exports = {
  groq,
  callGroqChat,
  DEFAULT_MODELS
};
