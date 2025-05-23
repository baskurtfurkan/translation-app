from google.cloud import speech

class SpeechService:
    def __init__(self):
        self.client = speech.SpeechClient()

    async def transcribe_audio(self, audio_content: bytes, language_code: str = "tr-TR"):
        """
        Convert audio to text using Google Cloud Speech-to-Text
        """
        try:
            audio = speech.RecognitionAudio(content=audio_content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code=language_code,
                enable_automatic_punctuation=True
            )

            response = self.client.recognize(config=config, audio=audio)

            if not response.results:
                return None

            transcript = response.results[0].alternatives[0].transcript
            return transcript

        except Exception as e:
            print(f"Error in speech to text conversion: {str(e)}")
            raise 