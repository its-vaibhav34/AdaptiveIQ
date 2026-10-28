import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config({ path: './backend/.env' });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  console.log('Testing Groq connection...');
  try {
    const models = await client.models.list();
    console.log('Available models:', models.data.map(m => m.id));

    const preferredModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
    console.log(`\nTesting generation with ${preferredModel}...`);
    const res = await client.chat.completions.create({
      model: preferredModel,
      messages: [{ role: 'user', content: 'Generate a short quiz title about Marvel.' }],
      max_tokens: 50,
    });
    console.log('Response:', res.choices[0]?.message?.content);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();

