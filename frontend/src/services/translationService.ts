import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { SpeechClient } from "@google-cloud/speech";
import { v2 } from "@google-cloud/translate";

export const translationService = {
  async speechToText(
    audioData: ArrayBuffer,
    language: string
  ): Promise<string> {
    const response = await fetch("/api/speech-to-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio: Array.from(new Uint8Array(audioData)),
        language,
      }),
    });

    if (!response.ok) {
      throw new Error("Speech to text conversion failed");
    }

    const data = await response.json();
    return data.text;
  },

  async translateText(
    text: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<string> {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        fromLanguage,
        toLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error("Translation failed");
    }

    const data = await response.json();
    return data.translatedText;
  },

  async textToSpeech(text: string, language: string): Promise<ArrayBuffer> {
    const response = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error("Text to speech conversion failed");
    }

    return await response.arrayBuffer();
  },
};
