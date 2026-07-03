const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
      apiVersion: 'v1',
    });
  }
  return genAI;
}

async function generate(prompt, options = {}) {
  const client = getClient();
  const model  = client.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      temperature:     options.temperature     ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  });

  const result   = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function testConnection() {
  try {
    const text = await generate('Reply with exactly: "Gemini connected"', {
      maxOutputTokens: 10,
    });
    return { connected: true, response: text.trim() };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = { generate, testConnection };