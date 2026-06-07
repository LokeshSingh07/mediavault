import { groq } from "../config/groq.config.js";
import { Readable } from "node:stream";
import { extractAudioFromVideo } from "./video.utils.js";



// take a audio file and transcribe it -> before passing video : extract audio from video
export async function transcribeWithGroq(buffer, originalName){
  const stream = Readable.from(buffer);
  stream.path = originalName;

  const transcription = await groq.audio.transcriptions.create({
    file: stream,
    model: "whisper-large-v3-turbo",  // fastest + cheapest whisper on groq
    response_format: "verbose_json",   // gives language + duration too
  });

  return {
    transcript: transcription.text,
    language: transcription.language,
    duration: transcription.duration
  }
}

async function summarizeChunk(transcript){
    const prompt = `
You are analyzing a transcript. Based on the transcript below, provide:
1. A concise summary (2-3 sentences)
2. Key points (max 5 bullet points)
3. Potential interview questions (max 5 questions)

Respond ONLY in this JSON format, no extra text:
{
    "summary": "...",
    "keyPoints": ["...", "..."],
    "questions": ["...", "..."]
}

Transcript:
${transcript}
    `;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
}


// Summarize with Llama
export const processWithGroqLlama = async (transcript) => {
  try{
    const CHUNK_SIZE = 3000;  // chars per chunk

    // if short enough → process directly
    if (transcript.length <= CHUNK_SIZE) {
      return await summarizeChunk(transcript);
    }

    // split inot chunk
    let chunks = [];
    for(let i = 0; i < transcript.length; i += CHUNK_SIZE){
      chunks.push(transcript.slice(i, i + CHUNK_SIZE));
    }

    
    // sequential — not Promise.all
    const chunkSummaries = [];
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Processing chunk ${index + 1}/${chunks.length}`);

      const result = await summarizeChunk(chunk);
      chunkSummaries.push(result);
      
      // wait 10 seconds between chunks — lets TPM reset
      if (index < chunks.length - 1) {
        console.log("Waiting 10s before next chunk...");
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // merge summaries
    const result = chunkSummaries.reduce((acc, chunk) => {
      acc.summary += chunk.summary;
      acc.keyPoints.push(...chunk.keyPoints);
      acc.questions.push(...chunk.questions);

      return acc;
    }, { summary: "", keyPoints: [], questions: [] });


    return {
      summary: result.summary,
      keyPoints: result.keyPoints,
      questions: result.questions
    }
  } catch(err){
    console.log("Error processing with Groq Llama", err);
    throw err;
  }
}


// step2: summarize + extract with Llama
export const processVideoWithGroq = async (videoBuffer, folder) => {
  try{
    // audio files → skip extraction, transcribe directly
    // video files → extract audio first
    const audioBuffer = folder === "audios" ? videoBuffer : await extractAudioFromVideo(videoBuffer);

    // convert audio to text
    const transcription = await transcribeWithGroq(audioBuffer, "audio.mp3");
    
    // generate summary/question 
    const analysis = await processWithGroqLlama(transcription.transcript);

    return {
      transcript: transcription.transcript,
      language: transcription.language,
      duration: transcription.duration,
      ...analysis
    }
  } catch(err){
    console.log("Error processing video with Groq", err);
    throw err;
  }
}





