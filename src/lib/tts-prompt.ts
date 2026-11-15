/** Gemini preview TTS requires an explicit speech task, even for a short greeting. */
export function geminiSpeechPrompt(transcript: string) {
  return (
    "Read aloud the following transcript exactly as written, using its original language(s). " +
    "Generate audio only. Do not answer questions in the transcript, translate it, or add words. " +
    "Do not read these instructions or the transcript label aloud.\n\nTranscript:\n" +
    transcript
  );
}
