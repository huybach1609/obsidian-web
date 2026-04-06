"use client";

import { useEffect, useState } from "react";

/** True after mount; avoids `document`/portal during SSR. */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
