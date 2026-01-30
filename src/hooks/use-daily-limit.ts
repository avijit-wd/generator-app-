import { useState, useCallback } from "react";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getStorageKey(type: string) {
  return `daily_${type}_${getToday()}`;
}

function getCount(type: string): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(getStorageKey(type));
  return val ? parseInt(val, 10) : 0;
}

function setCount(type: string, count: number) {
  localStorage.setItem(getStorageKey(type), count.toString());
}

export function useDailyLimit(type: string, limit: number) {
  const [used, setUsed] = useState(() => getCount(type));

  const limitReached = used >= limit;

  const increment = useCallback(() => {
    const newCount = getCount(type) + 1;
    setCount(type, newCount);
    setUsed(newCount);
  }, [type]);

  return { used, limit, limitReached, increment };
}
