from google.cloud import translate

class TranslationService:
    def __init__(self):
        self.client = translate.TranslationServiceClient()
        
    async def translate_text(self, text: str, source_language: str, target_language: str):
        """
        Translate text from source language to target language
        """
        try:
            response = self.client.translate_text(
                request={
                    "parent": "projects/prime-service-458411-j6",
                    "contents": [text],
                    "mime_type": "text/plain",
                    "source_language_code": source_language,
                    "target_language_code": target_language,
                }
            )

            if not response.translations:
                return None

            translation = response.translations[0].translated_text
            return translation

        except Exception as e:
            print(f"Error in translation: {str(e)}")
            raise 