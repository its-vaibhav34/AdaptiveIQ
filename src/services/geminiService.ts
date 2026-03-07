import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateQuiz(topic: string, count: number, difficulty: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a quiz about "${topic}" with ${count} questions at ${difficulty} difficulty level.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
                timeLimit: { type: Type.INTEGER, description: "Time limit in seconds" }
              },
              required: ["text", "options", "correctAnswer", "timeLimit"]
            }
          }
        },
        required: ["title", "category", "difficulty", "questions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
