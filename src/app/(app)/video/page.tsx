"use client";

import { useState } from "react";
import { generateVideo } from "@/app/actions";
import Loader from "@/components/loader";
import { useDailyLimit } from "@/hooks/use-daily-limit";

export default function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { used, limit, limitReached, increment } = useDailyLimit("video", 5);

  async function handleGenerate() {
    if (!prompt.trim() || limitReached) return;
    setLoading(true);
    setError(null);
    setVideoSrc(null);
    try {
      const result = await generateVideo(prompt);
      const src = `data:video/mp4;base64,${result.video}`;
      setVideoSrc(src);
      setPrompt("");
      increment();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate video");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!videoSrc) return;
    const a = document.createElement("a");
    a.href = videoSrc;
    a.download = "youtube-short.mp4";
    a.click();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto p-8">
        <h2 className="text-2xl font-bold mb-4">Video Generation</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading && (
          <Loader message="Generating your video, this may take several minutes..." />
        )}

        {videoSrc && (
          <div className="space-y-3 max-w-2xl">
            <video
              src={videoSrc}
              controls
              className="rounded border max-h-[70vh] mx-auto"
            />
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              Download Video
            </button>
          </div>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto rounded-full border border-gray-300 bg-white flex items-center gap-2 px-4 py-2 shadow-sm">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="flex-1 text-sm bg-transparent text-black outline-none"
            onKeyDown={(e) => e.key === "Enter" && !limitReached && handleGenerate()}
          />
          <span
            className={`text-xs whitespace-nowrap ${limitReached ? "text-red-500 font-medium" : "text-gray-400"}`}
          >
            {used}/{limit}
            {limitReached && " — Limit reached"}
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || limitReached}
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
