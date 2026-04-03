"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal } from "@heroui/react";
import { LockIcon, MailIcon } from "lucide-react";

import { setAuthToken } from "@/lib/axios";
import {
  login,
  LoginError,
  registerInitialAccount,
} from "@/services/authservice";
import {
  useAppSettings,
  getTokenFromCookie,
  getLastVisitedPathFromCookie,
} from "@/contexts/AppContext";
import { siteConfig } from "@/config/site";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, setAccessToken } = useAppSettings();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [isInitialAccountMode, setIsInitialAccountMode] = useState(false);

  useEffect(() => {
    const token = accessToken ?? getTokenFromCookie();

    if (token) {
      if (!accessToken && token) {
        setAccessToken(token);
      }
      const lastPath = getLastVisitedPathFromCookie();
      const redirectPath =
        lastPath && lastPath.startsWith("/notes") ? lastPath : "/notes";

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
        // Redirect to last visited path or home (which will handle redirect)
        router.push("/");
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");

          return;
        }

        // Create the initial account, then log in with it
        await registerInitialAccount(username, password);
        const data = await login(username, password);

        setAccessToken(data.token);
        setAuthToken(data.token);
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof LoginError) {
        // If no credentials are configured yet, switch to "initial account" mode
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

  const { name } = siteConfig;

  return (
    <div className="">
      <Image
        width={1000}
        height={1000}
        alt="Logo"
        className="h-[100vh] w-full object-cover"
        src="/bg_login.webp"
      />
      <Modal>
        <Modal.Backdrop
          variant="blur"
          isDismissable={false}
          isOpen={true}
          onOpenChange={() => {}}
        >
          <Modal.Container placement="center">
            <Modal.Dialog>
              <form onSubmit={handleSubmit}>
                <Modal.Header className="flex gap-1 items-center">
                  <img alt="Logo" className="h-10 w-10" src="/favicon.ico" />
                  <h2 className="text-2xl font-bold">{name}</h2>
                </Modal.Header>
                <Modal.Body>
                  <Input
                    required
                    autoComplete="username"
                    disabled={loggingIn}
                    placeholder="Enter your username"
                    value={username}
                    variant="primary"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    required
                    autoComplete="current-password"
                    disabled={loggingIn}
                    placeholder={
                      isInitialAccountMode
                        ? "Enter a new password"
                        : "Enter your password"
                    }
                    type="password"
                    value={password}
                    variant="primary"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {isInitialAccountMode && (
                    <Input
                      required
                      autoComplete="new-password"
                      disabled={loggingIn}
                      placeholder="Re-enter your password"
                      type="password"
                      value={confirmPassword}
                      variant="secondary"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  )}
                  {isInitialAccountMode && (
                    <p className="text-xs text-default-500">
                      This will create the initial account and store it securely
                      in your Obsidian vault.
                    </p>
                  )}
                  {error && (
                    <div className="p-3 bg-danger/10 dark:bg-danger/20 border border-danger/20 dark:border-danger/40 rounded-md text-danger text-sm">
                      {error}
                    </div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    isDisabled={
                      loggingIn ||
                      !username ||
                      !password ||
                      (isInitialAccountMode && !confirmPassword)
                    }
                    type="submit"
                  >
                    {loggingIn
                      ? isInitialAccountMode
                        ? "Creating account..."
                        : "Logging in..."
                      : isInitialAccountMode
                        ? "Create initial account"
                        : "Sign in"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
