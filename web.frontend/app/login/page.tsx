"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, InputGroup, TextField } from "@heroui/react";
import { ArrowRight, EyeIcon, EyeOffIcon } from "lucide-react";

import { setAuthToken } from "@/lib/axios";
import {
  getDemoGuestCredentials,
  login,
  LoginError,
  registerInitialAccount,
} from "@/services/authservice";
import {
  useAuthSettings,
  getTokenFromCookie,
  getLastVisitedPathFromCookie,
} from "@/contexts/AppContext";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, setAccessToken } = useAuthSettings();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [isInitialAccountMode, setIsInitialAccountMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const token = accessToken ?? getTokenFromCookie();

    if (token) {
      if (!accessToken && token) {
        setAccessToken(token);
      }
      const lastPath = getLastVisitedPathFromCookie();
      const sanitizedPath = lastPath
        ? lastPath.replace(/[\u0000-\u001F\u007F]/g, "").trim()
        : null;
      const redirectPath =
        sanitizedPath && sanitizedPath.startsWith("/notes")
          ? sanitizedPath
          : "/notes";

      router.push(redirectPath);
    }
  }, [accessToken, router, setAccessToken]);

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setError(null);
    setLoggingIn(true);

    try {
      if (!isInitialAccountMode) {
        const data = await login(username, password);

        setAccessToken(data.token);
        setAuthToken(data.token);
        router.push("/");
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");

          return;
        }

        await registerInitialAccount(username, password);
        const data = await login(username, password);

        setAccessToken(data.token);
        setAuthToken(data.token);
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof LoginError) {
        if (
          !isInitialAccountMode &&
          err.statusCode === 404 &&
          err.message === "CredentialsNotConfigured"
        ) {
          setIsInitialAccountMode(true);
          setError(
            "No account found. Create the initial account to start using the app.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleGuestLogin() {
    setError(null);
    setLoggingIn(true);

    try {
      const demoData = await getDemoGuestCredentials();

      setUsername(demoData.username);
      setPassword(demoData.password);

      const authData = await login(demoData.username, demoData.password);

      setAccessToken(authData.token);
      setAuthToken(authData.token);

      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Demo sign in failed.";

      setError(message);
    } finally {
      setLoggingIn(false);
    }
  }

  const { name, description } = siteConfig;

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col md:flex-row md:min-h-0">
      <section className="relative hidden min-h-0 w-full md:flex md:w-1/2 md:min-h-screen">
        <Image
          fill
          priority
          alt=""
          className="object-cover"
          sizes="50vw"
          src="/bg_login.webp"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/50"
        />
        <div className="relative z-10 flex h-full min-h-screen flex-col justify-between p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                alt=""
                className="h-10 w-10"
                height={40}
                src="/favicon.ico"
                width={40}
              />
              <span className="text-lg font-semibold text-white">{name}</span>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
              href="/"
            >
              Back to home
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <p className="max-w-md text-balance text-2xl font-semibold leading-tight tracking-tight text-white lg:text-3xl">
            Your notes, synced and ready wherever you open them.
          </p>
          <p className="text-sm text-white/70">{description}</p>
        </div>
      </section>

      <section className="flex flex-1 flex-col justify-center bg-background px-6 py-10 md:w-1/2 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isInitialAccountMode ? "Set up your vault" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {isInitialAccountMode
                ? "Create the first account for this server. Credentials are stored in your Obsidian vault."
                : "Access your vault with your username and password."}
            </p>
          </header>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              fullWidth
              required
              aria-label="Username"
              autoComplete="username"
              disabled={loggingIn}
              placeholder="Username"
              value={username}
              variant="primary"
              onChange={(e) => setUsername(e.target.value)}
            />

            <TextField
              fullWidth
              aria-label={isInitialAccountMode ? "New password" : "Password"}
              variant="primary"
            >
              <InputGroup fullWidth variant="primary">
                <InputGroup.Input
                  required
                  aria-label={
                    isInitialAccountMode ? "New password" : "Password"
                  }
                  autoComplete={
                    isInitialAccountMode ? "new-password" : "current-password"
                  }
                  disabled={loggingIn}
                  placeholder={
                    isInitialAccountMode
                      ? "Enter a new password"
                      : "Enter your password"
                  }
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputGroup.Suffix className="pr-1">
                  <Button
                    isIconOnly
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="size-9 min-w-9 shrink-0"
                    isDisabled={loggingIn}
                    type="button"
                    variant="ghost"
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
            </TextField>

            {isInitialAccountMode && (
              <TextField
                fullWidth
                aria-label="Confirm password"
                variant="secondary"
              >
                <InputGroup fullWidth variant="secondary">
                  <InputGroup.Input
                    required
                    aria-label="Confirm password"
                    autoComplete="new-password"
                    disabled={loggingIn}
                    placeholder="Re-enter your password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <InputGroup.Suffix className="pr-1">
                    <Button
                      isIconOnly
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="size-9 min-w-9 shrink-0"
                      isDisabled={loggingIn}
                      type="button"
                      variant="ghost"
                      onPress={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </Button>
                  </InputGroup.Suffix>
                </InputGroup>
              </TextField>
            )}

            {isInitialAccountMode && (
              <p className="text-xs text-default-500">
                This will create the initial account and store it securely in
                your Obsidian vault.
              </p>
            )}

            {error && (
              <div className="rounded-md border border-danger/20 bg-danger/10 p-3 text-sm text-danger dark:border-danger/40 dark:bg-danger/20">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              isDisabled={
                loggingIn ||
                !username ||
                !password ||
                (isInitialAccountMode && !confirmPassword)
              }
              type="submit"
              variant="primary"
            >
              {loggingIn
                ? isInitialAccountMode
                  ? "Creating account..."
                  : "Signing in..."
                : isInitialAccountMode
                  ? "Create initial account"
                  : "Sign in"}
            </Button>
            {!isInitialAccountMode && (
              <Button
                className="w-full"
                isDisabled={loggingIn}
                type="button"
                variant="secondary"
                onPress={handleGuestLogin}
              >
                {loggingIn ? "Signing in..." : "Try demo account"}
              </Button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
