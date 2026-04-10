import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  LAST_VISITED_PATH_COOKIE_KEY,
  TOKEN_COOKIE_KEY,
} from "@/lib/constants";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_KEY)?.value ?? null;

  if (token) {
    const lastPathRaw =
      cookieStore.get(LAST_VISITED_PATH_COOKIE_KEY)?.value ?? null;

    let lastPath: string | null = lastPathRaw;

    try {
      if (lastPathRaw) lastPath = decodeURIComponent(lastPathRaw);
    } catch {
      // ignore malformed cookie encoding
    }

    // Prevent invalid Location headers from malformed cookie values
    // (e.g. CR/LF control chars in production container logs).
    const sanitizedPath = lastPath
      ? lastPath.replace(/[\u0000-\u001F\u007F]/g, "").trim()
      : null;
    const redirectPath =
      sanitizedPath && sanitizedPath.startsWith("/notes")
        ? sanitizedPath
        : "/notes";

    redirect(redirectPath);
  }

  redirect("/login");
}
