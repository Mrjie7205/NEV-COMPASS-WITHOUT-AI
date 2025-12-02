import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Fix TS2580: Cannot find name 'process'
declare const process: any;

// Initialize the Gemini API client
// API KEY must be provided in the environment variable
// As per guidelines: Assume process.env.API_KEY is pre-configured and valid.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'models/gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topK: 40,
      },
    });
  }
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const chat = getChatSession();
    const result = await chat.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const resetSession = () => {
    chatSession = null;
};