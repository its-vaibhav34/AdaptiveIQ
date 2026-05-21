import { getApiBase } from './config';

export async function generateQuiz(topic: string, count: number, difficulty: string) {
  const url = `${getApiBase()}/quizzes/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, count, difficulty }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Server error ${response.status}`);
  }

  return response.json();
}
