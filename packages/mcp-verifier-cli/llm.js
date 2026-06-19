import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const {GEMINI_API_KEY} = process.env;



const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

async function sendToGemini() {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await sendToGemini();

export {sendToGemini};