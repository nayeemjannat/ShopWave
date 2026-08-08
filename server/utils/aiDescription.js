import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-flash-001'];

const safeJsonParse = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/[\u0000-\u001F]/g, ' ').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
};

const generateProductDescription = async ({ name, specs, storeType }) => {
  const prompt = `You are a professional e-commerce copywriter. Write a compelling product description for:
Product: ${name}
Store Type: ${storeType}
Specs: ${JSON.stringify(specs)}

Respond in this exact JSON format (no markdown, no backticks):
{"english": "...", "bangla": "..."}

English: 2-3 paragraphs, professional tone, SEO-friendly, include key specs naturally.
Bangla: Same content translated to natural Bangla (not Google Translate quality).`;

  for (const modelName of GEMINI_MODELS) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const parsed = safeJsonParse(text);
      if (parsed?.english && parsed?.bangla) return parsed;
    } catch (e) {
      console.error(`Gemini ${modelName} failed: ${e.message}`);
    }
  }

  console.error('All Gemini models failed. Falling back to Groq.');
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });
    const parsed = safeJsonParse(chatCompletion.choices[0]?.message?.content || '');
    if (parsed?.english && parsed?.bangla) return parsed;
  } catch (err2) {
    console.error(`Groq failed: ${err2.message}.`);
  }

  return {
    english: `${name} - ${JSON.stringify(specs)}. Available now.`,
    bangla: `${name} - এখন পাওয়া যাচ্ছে।`,
  };
};

export default generateProductDescription;
