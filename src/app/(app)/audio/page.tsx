"use client";

import { useState } from "react";
import { generateAudio } from "@/app/actions";
import Loader from "@/components/loader";

const voices = ["Kore", "Puck", "Zephyr", "Enceladus", "Charon", "Leda"];

export default function AudioPage() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Kore");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [hindiText, setHindiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setAudioSrc(null);
    setHindiText(null);
    try {
      const result = await generateAudio(text, voice);
      const src = `data:audio/mp3;base64,${result.audio}`;
      setAudioSrc(src);
      setHindiText(result.hindiText);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate audio");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!audioSrc) return;
    const a = document.createElement("a");
    a.href = audioSrc;
    a.download = "generated-audio.mp3";
    a.click();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Text to Audio</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading && <Loader message="Translating and generating audio..." />}

        {audioSrc && (
          <div className="space-y-3 max-w-2xl">
            {hindiText && (
              <div className="bg-gray-100 rounded p-3 text-sm text-black">
                <span className="font-medium text-gray-600">Hindi: </span>
                {hindiText}
              </div>
            )}
            <audio src={audioSrc} controls className="w-full max-w-full" />
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              Download Audio
            </button>
          </div>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="p-3 md:p-4 mb-[100px]">
        <div className="max-w-2xl mx-auto rounded-2xl md:rounded-3xl border border-gray-300 bg-white px-3 py-2 md:px-4 md:py-3 shadow-sm">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
            }}
            placeholder="Enter text in English — translated to Hindi..."
            rows={1}
            className="w-full text-sm bg-transparent text-black outline-none resize-none"
          />
          <div className="flex gap-2 items-center mt-1 flex-wrap">
            <label className="text-xs text-gray-500">Voice:</label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="border border-gray-200 rounded-full px-2 py-1 text-xs bg-transparent text-black outline-none"
            >
              {voices.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-full text-sm disabled:opacity-50 ml-auto whitespace-nowrap"
            >
              {loading ? "..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
