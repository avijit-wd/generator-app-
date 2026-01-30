"use server";

import { GoogleGenAI } from "@google/genai";
import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ============================================================
// VIDEO DAILY LIMIT (5 per day)
// ============================================================
const DAILY_VIDEO_LIMIT = 5;
let videoCount = 0;
let videoCountDate = new Date().toDateString();

function checkVideoLimit() {
  const today = new Date().toDateString();
  if (today !== videoCountDate) {
    videoCount = 0;
    videoCountDate = today;
    console.log("[Video] Daily counter reset");
  }
  if (videoCount >= DAILY_VIDEO_LIMIT) {
    console.log(`[Video] Daily limit reached (${videoCount}/${DAILY_VIDEO_LIMIT})`);
    throw new Error(`Daily video limit reached (${DAILY_VIDEO_LIMIT}/day). Try again tomorrow.`);
  }
}

export async function getVideoLimitStatus() {
  const today = new Date().toDateString();
  if (today !== videoCountDate) {
    videoCount = 0;
    videoCountDate = today;
  }
  return { used: videoCount, limit: DAILY_VIDEO_LIMIT };
}

// ============================================================
// IMAGE DAILY LIMIT (10 per day)
// ============================================================
const DAILY_IMAGE_LIMIT = 10;
let imageCount = 0;
let imageCountDate = new Date().toDateString();

function checkImageLimit() {
  const today = new Date().toDateString();
  if (today !== imageCountDate) {
    imageCount = 0;
    imageCountDate = today;
    console.log("[Image] Daily counter reset");
  }
  if (imageCount >= DAILY_IMAGE_LIMIT) {
    console.log(`[Image] Daily limit reached (${imageCount}/${DAILY_IMAGE_LIMIT})`);
    throw new Error(`Daily image limit reached (${DAILY_IMAGE_LIMIT}/day). Try again tomorrow.`);
  }
}

export async function getImageLimitStatus() {
  const today = new Date().toDateString();
  if (today !== imageCountDate) {
    imageCount = 0;
    imageCountDate = today;
  }
  return { used: imageCount, limit: DAILY_IMAGE_LIMIT };
}

// ============================================================
// GEMINI IMPLEMENTATIONS
// ============================================================

export async function generateImage(prompt: string) {
  checkImageLimit();
  console.log(`[Image] Starting generation... (${imageCount + 1}/${DAILY_IMAGE_LIMIT} today)`);
  console.log("[Image] Prompt:", prompt);
  console.log("[Image] Model: imagen-4.0-generate-001");

  const start = Date.now();
  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
    },
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[Image] Generation complete in ${elapsed}s`);

  const imageBytes = response.generatedImages![0].image!.imageBytes!;
  imageCount++;
  console.log(
    `[Image] Image size: ${(Buffer.from(imageBytes, "base64").length / 1024).toFixed(1)} KB`,
  );
  console.log(`[Image] Daily usage: ${imageCount}/${DAILY_IMAGE_LIMIT}`);

  return { image: imageBytes };
}

export async function generateVideo(prompt: string) {
  checkVideoLimit();
  console.log(`[Video] Starting generation... (${videoCount + 1}/${DAILY_VIDEO_LIMIT} today)`);
  console.log("[Video] Prompt:", prompt);
  console.log("[Video] Model: veo-3.0-generate-001 | Aspect: 9:16 (Shorts)");

  const start = Date.now();
  let operation = await ai.models.generateVideos({
    model: "veo-3.0-generate-001",
    prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: "9:16",
    },
  });
  console.log("[Video] Job created, polling for completion...");

  // Poll until complete
  let pollCount = 1;
  while (!operation.done) {
    console.log(`[Video] Poll #${pollCount} — not done yet...`);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
    pollCount++;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `[Video] Generation complete in ${elapsed}s after ${pollCount} polls`,
  );

  const generatedVideo = operation.response?.generatedVideos?.[0];
  if (!generatedVideo) {
    console.error("[Video] No generated video in response");
    throw new Error("Video generation failed — no video returned");
  }
  console.log("[Video] Video ready, downloading via SDK...");

  // Download video using SDK's downloadFile method
  const downloadPath = join(tmpdir(), `video-${Date.now()}.mp4`);
  await ai.files.download({
    file: generatedVideo,
    downloadPath,
  });

  const buffer = await readFile(downloadPath);
  const base64 = buffer.toString("base64");
  await unlink(downloadPath).catch(() => {});

  videoCount++;
  console.log(
    `[Video] Download complete — size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`[Video] Daily usage: ${videoCount}/${DAILY_VIDEO_LIMIT}`);

  return { video: base64 };
}

export async function generateAudio(text: string, voice: string) {
  console.log("[Audio] Starting generation...");
  console.log("[Audio] Voice:", voice);
  console.log("[Audio] Original text (English):", text);

  const start = Date.now();

  // Translate English to Hindi using Gemini
  console.log("[Audio] Translating English to Hindi...");
  const translation = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: text,
    config: {
      systemInstruction:
        "You are a translator. Translate the given English text to Hindi. Return only the translated Hindi text, nothing else.",
    },
  });

  const hindiText = translation.text!;
  console.log("[Audio] Translated text (Hindi):", hindiText);

  // Generate speech from Hindi text
  console.log("[Audio] Generating speech — Model: gemini-2.5-flash-preview-tts");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: hindiText }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const audioData =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    console.error("[Audio] No audio data in response");
    throw new Error("Audio generation failed — no audio data returned");
  }

  // Convert raw PCM to MP3 using ffmpeg
  console.log("[Audio] Converting PCM to MP3 via ffmpeg...");
  const rawPcm = Buffer.from(audioData, "base64");
  const id = Date.now().toString();
  const pcmPath = join(tmpdir(), `audio-${id}.pcm`);
  const mp3Path = join(tmpdir(), `audio-${id}.mp3`);

  await writeFile(pcmPath, rawPcm);

  await new Promise<void>((resolve, reject) => {
    execFile(
      "ffmpeg",
      ["-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcmPath, "-b:a", "192k", mp3Path],
      (err) => (err ? reject(err) : resolve()),
    );
  });

  const mp3Buffer = await readFile(mp3Path);
  const mp3Base64 = mp3Buffer.toString("base64");

  // Cleanup temp files
  await unlink(pcmPath).catch(() => {});
  await unlink(mp3Path).catch(() => {});

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `[Audio] Generation complete in ${elapsed}s — MP3 size: ${(mp3Buffer.length / 1024).toFixed(1)} KB`,
  );

  return { audio: mp3Base64, hindiText };
}

// ============================================================
// OPENAI IMPLEMENTATIONS (commented out)
// ============================================================

// import OpenAI from "openai";
//
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
//
// export async function generateImage(prompt: string) {
//   console.log("[Image] Starting generation...");
//   console.log("[Image] Prompt:", prompt);
//   console.log("[Image] Model: dall-e-3 | Size: 1024x1024");
//
//   const start = Date.now();
//   const response = await openai.images.generate({
//     model: "dall-e-3",
//     prompt,
//     n: 1,
//     size: "1024x1024",
//     response_format: "b64_json",
//   });
//
//   const elapsed = ((Date.now() - start) / 1000).toFixed(1);
//   console.log(`[Image] Generation complete in ${elapsed}s`);
//   console.log("[Image] Revised prompt:", response.data![0].revised_prompt);
//
//   return {
//     image: response.data![0].b64_json!,
//     revisedPrompt: response.data![0].revised_prompt,
//   };
// }
//
// export async function generateVideo(prompt: string) {
//   console.log("[Video] Starting generation...");
//   console.log("[Video] Prompt:", prompt);
//   console.log("[Video] Model: sora-2 | Duration: 12s | Size: 1280x720");
//
//   const start = Date.now();
//   const video = await openai.videos.create({
//     model: "sora-2",
//     prompt,
//     seconds: "4",
//     size: "1280x720",
//   });
//   console.log("[Video] Job created with ID:", video.id);
//   console.log("[Video] Initial status:", video.status);
//
//   let result = await openai.videos.retrieve(video.id);
//   let pollCount = 1;
//   while (result.status !== "completed" && result.status !== "failed") {
//     console.log(
//       `[Video] Poll #${pollCount} — status: ${result.status}, progress: ${result.progress}%`,
//     );
//     await new Promise((resolve) => setTimeout(resolve, 5000));
//     result = await openai.videos.retrieve(video.id);
//     pollCount++;
//   }
//
//   if (result.status === "failed") {
//     console.error("[Video] Generation FAILED:", result.error);
//     throw new Error("Video generation failed");
//   }
//
//   const elapsed = ((Date.now() - start) / 1000).toFixed(1);
//   console.log(
//     `[Video] Generation complete in ${elapsed}s after ${pollCount} polls`,
//   );
//
//   console.log("[Video] Downloading video content...");
//   const response = await openai.videos.downloadContent(video.id);
//   const buffer = Buffer.from(await response.arrayBuffer());
//   const base64 = buffer.toString("base64");
//   console.log(
//     `[Video] Download complete — size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
//   );
//
//   return { video: base64 };
// }
//
// export async function generateAudio(text: string, voice: string) {
//   console.log("[Audio] Starting generation...");
//   console.log("[Audio] Voice:", voice);
//   console.log("[Audio] Original text (English):", text);
//
//   const start = Date.now();
//
//   console.log("[Audio] Translating English to Hindi...");
//   const translation = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content: "You are a translator. Translate the given English text to Hindi. Return only the translated Hindi text, nothing else.",
//       },
//       { role: "user", content: text },
//     ],
//   });
//
//   const hindiText = translation.choices[0].message.content!;
//   console.log("[Audio] Translated text (Hindi):", hindiText);
//
//   console.log("[Audio] Generating speech — Model: tts-1-hd | Format: mp3");
//   const response = await openai.audio.speech.create({
//     model: "tts-1-hd",
//     voice: voice as "alloy" | "echo" | "fable" | "nova" | "onyx" | "shimmer",
//     input: hindiText,
//     response_format: "mp3",
//   });
//
//   const buffer = Buffer.from(await response.arrayBuffer());
//   const base64 = buffer.toString("base64");
//
//   const elapsed = ((Date.now() - start) / 1000).toFixed(1);
//   console.log(
//     `[Audio] Generation complete in ${elapsed}s — size: ${(buffer.length / 1024).toFixed(1)} KB`,
//   );
//
//   return { audio: base64, hindiText };
// }
