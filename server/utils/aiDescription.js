import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const generateProductDescription = async ({ name, specs, storeType }) => {
  const prompt = `You are a professional e-commerce copywriter. Write a compelling product description for:
Product: ${name}
Store Type: ${storeType}
Specs: ${JSON.stringify(specs)}

Respond in this exact JSON format (no markdown, no backticks):
{"english": "...", "bangla": "..."}

English: 2-3 paragraphs, professional tone, SEO-friendly, include key specs naturally.
Bangla: Same content translated to natural Bangla (not Google Translate quality).`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (err1) {
    console.error(`Gemini failed: ${err1.message}. Falling back to Groq.`);
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
      });
      return JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    } catch (err2) {
      console.error(`Groq failed: ${err2.message}. Returning fallback template.`);
      return {
        english: `${name} - ${JSON.stringify(specs)}. Available now.`,
        bangla: `${name} - এখন পাওয়া যাচ্ছে।`,
      };
    }
  }
};

export default generateProductDescription;
