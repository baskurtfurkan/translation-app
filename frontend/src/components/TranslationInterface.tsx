import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import io, { Socket } from "socket.io-client";
import { theme } from "../styles/theme";

interface TranslationInterfaceProps {
  socket: any;
}

const Container = styled.div`
  padding: ${theme.spacing.lg};
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  &:disabled {
    background-color: #ccc;
  }
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 5px;
`;

const TranscriptContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  border-radius: 5px;
  background-color: #f8f9fa;
`;

const TranslationInterface: React.FC<TranslationInterfaceProps> = ({
  socket,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("tr");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io("http://localhost:8000");

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socketRef.current.on("translation_result", (data: any) => {
      setOriginalText(data.original_text);
      setTranslatedText(data.translated_text);

      // Convert audio buffer to base64 string
      const audioData = new Uint8Array(data.audio);
      const base64Audio = btoa(
        audioData.reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Create and play audio
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    });

    socketRef.current.on("error", (error: any) => {
      console.error("Translation error:", error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        const reader = new FileReader();
        reader.readAsArrayBuffer(audioBlob);

        reader.onloadend = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          socketRef.current?.emit("audio_data", {
            audio: arrayBuffer,
            source_language: sourceLanguage,
            target_language: targetLanguage,
          });
        };
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <Container>
      <h2>Çeviri Arayüzü</h2>

      <Controls>
        <Select
          value={sourceLanguage}
          onChange={(e) => setSourceLanguage(e.target.value)}
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </Select>

        <Select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </Select>

        <Button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </Controls>

      <TranscriptContainer>
        <h3>Original Text:</h3>
        <p>{originalText}</p>

        <h3>Translated Text:</h3>
        <p>{translatedText}</p>
      </TranscriptContainer>
    </Container>
  );
};

export default TranslationInterface;
