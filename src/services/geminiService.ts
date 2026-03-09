export async function generateQuiz(topic: string, count: number, difficulty: string) {
  const response = await fetch('/api/quizzes/generate', {
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
