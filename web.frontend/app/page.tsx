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

    const redirectPath =
      lastPath && lastPath.startsWith("/notes") ? lastPath : "/notes";

    redirect(redirectPath);
  }

  redirect("/login");
}
