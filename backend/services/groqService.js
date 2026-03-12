import Groq from 'groq-sdk';

let _client = null;

function getClient() {
  if (!_client) {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY is not set in environment. AI generation is disabled.');
    }
    _client = new Groq({ apiKey: key });
  }
  return _client;
}

/**
 * Generate a quiz using Groq LLM.
 * @param {{ topic: string, count?: number, difficulty?: string }} options
 * @returns {Promise<{ title: string, category: string, difficulty: string, questions: Array }>}
 */
export async function generateQuizWithAI({ topic, count = 5, difficulty = 'Medium' }) {
  const client = getClient();

  const prompt = `You are a quiz generator. Create a quiz about "${topic}" with exactly ${count} questions at ${difficulty} difficulty level.

Return ONLY valid JSON (no markdown code blocks, no extra text) in this exact structure:
{
  "title": "Engaging Quiz Title",
  "category": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "text": "Question text ending with a question mark?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "timeLimit": 15
    }
  ]
}

Rules:
- Generate exactly ${count} questions
- Each question must have exactly 4 options (no more, no less)
- correctAnswer is the 0-based index (0-3) of the correct option
- timeLimit is in seconds (use 15 for most questions, 20-30 for harder ones)
- Make questions educational, engaging, and factually accurate
- Vary the difficulty slightly within the overall ${difficulty} range`;

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    temperature: 0.75,
  });

  const raw = response.choices[0]?.message?.content || '';

  // Strip markdown code fences if model adds them
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  // Extract first valid JSON object
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Groq did not return valid JSON. Raw response: ' + raw.slice(0, 200));
  }

  let quizData;
  try {
    quizData = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Failed to parse Groq JSON response. Check model output formatting.');
  }

  // Basic validation
  if (!quizData.title || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error('Generated quiz is missing required fields (title or questions).');
  }

  // Ensure all questions have 4 options (repair if needed)
  quizData.questions = quizData.questions.map((q, i) => {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${i + 1} does not have exactly 4 options`);
    }
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      throw new Error(`Question ${i + 1} has invalid correctAnswer (must be 0–3)`);
    }
    return { ...q, timeLimit: q.timeLimit || 15 };
  });

  return quizData;
}
