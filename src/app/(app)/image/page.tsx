"use client";

import { useState } from "react";
import { generateImage } from "@/app/actions";
import Loader from "@/components/loader";
import { useDailyLimit } from "@/hooks/use-daily-limit";

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { used, limit, limitReached, increment } = useDailyLimit("image", 10);

  async function handleGenerate() {
    if (!prompt.trim() || limitReached) return;
    setLoading(true);
    setError(null);
    setImageSrc(null);
    try {
      const result = await generateImage(prompt);
      setImageSrc(`data:image/png;base64,${result.image}`);
      setPrompt("");
      increment();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!imageSrc) return;
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = "generated-image.png";
    a.click();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Image Generation</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading && <Loader message="Generating your image..." />}

        {imageSrc && (
          <div className="space-y-3 max-w-2xl">
            <img src={imageSrc} alt="Generated" className="rounded border max-w-full" />
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              Download Image
            </button>
          </div>
        )}
      </div>

      {/* Input area - fixed at bottom */}
      <div className="p-3 md:p-4">
        <div className="max-w-2xl mx-auto rounded-2xl md:rounded-3xl border border-gray-300 bg-white px-3 py-2 md:px-4 md:py-3 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !limitReached) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Describe the image you want to generate..."
            rows={1}
            className="w-full text-sm bg-transparent text-black outline-none resize-none"
          />
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs whitespace-nowrap ${limitReached ? "text-red-500 font-medium" : "text-gray-400"}`}
            >
              {used}/{limit}
              {limitReached && " — Limit reached"}
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || limitReached}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-full text-sm disabled:opacity-50 whitespace-nowrap ml-auto"
            >
              {loading ? "..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
