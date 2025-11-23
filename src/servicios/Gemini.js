import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Inicializa la librería con tu clave
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 2. Define el modelo. 'gemini-1.5-flash' es rápido, económico y bueno para la capa gratuita.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateResponse = async (prompt) => {
  try {
    // 3. Genera el contenido
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error al conectar con Gemini:", error);
    throw error;
  }
};