import { NextRequest, NextResponse } from "next/server";

type LoginResponse = {
  token?: string;
};

function resolveApiBaseUrl(request: NextRequest): string {
  if (process.env.NODE_ENV === "production") {
    const configured = process.env.NEXT_PUBLIC_API_URL || "/api";

    if (configured.startsWith("http://") || configured.startsWith("https://")) {
      return configured;
    }

    return new URL(configured, request.nextUrl.origin).toString();
  }

  const protocol = process.env.NEXT_PUBLIC_API_PROTOCOL || "http";
  const host = process.env.NEXT_PUBLIC_API_HOST || "localhost";
  const port = process.env.NEXT_PUBLIC_API_PORT || "8080";

  return `${protocol}://${host}:${port}/api`;
}

export async function POST(request: NextRequest) {
  const demoUsername = process.env.DEMO_USERNAME;
  const demoPassword = process.env.DEMO_PASSWORD;

  if (!demoUsername || !demoPassword) {
    return NextResponse.json(
      { message: "Demo access is not configured." },
      { status: 503 },
    );
  }

  const apiBaseUrl = resolveApiBaseUrl(request);

  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: demoUsername,
        password: demoPassword,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as
      | LoginResponse
      | { message?: string }
      | null;

    if (!response.ok || !data?.token) {
      return NextResponse.json(
        {
          message:
            (data as { message?: string } | null)?.message ||
            "Demo sign in failed.",
        },
        { status: response.status || 502 },
      );
    }

    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error("Guest auth endpoint error:", error);

    return NextResponse.json(
      { message: "Unable to reach authentication service." },
      { status: 502 },
    );
  }
}
