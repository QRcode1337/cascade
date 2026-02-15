"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RunStatusPollerProps {
  shouldPoll: boolean;
  intervalMs?: number;
}

export function RunStatusPoller({
  shouldPoll,
  intervalMs = 2000,
}: RunStatusPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, router, shouldPoll]);

  if (!shouldPoll) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground mt-2">
      Auto-refreshing run status…
    </p>
  );
}
