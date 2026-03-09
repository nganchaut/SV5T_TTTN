
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
let ai: any = null;
try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
} catch(e) {
  console.warn("Gemini Client not initialized");
}

export const analyzeEvidence = async (fileName: string, description: string) => {
  if (!ai) {
    console.error("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in .env");
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Phân tích minh chứng hồ sơ Sinh viên 5 Tốt: 
      Tên tệp: ${fileName}
      Mô tả: ${description}
      Hãy đánh giá xem minh chứng này có phù hợp để làm 'Tiêu chí cứng' không và gợi ý điểm số dựa trên quy định (Cấp khoa, Trường, TW). 
      Trả về kết quả dưới dạng JSON có fields: isSuitable (boolean), suggestedScore (number), reasoning (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSuitable: { type: Type.BOOLEAN },
            suggestedScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["isSuitable", "suggestedScore", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
