'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/axios';
import { login, LoginError, registerInitialAccount } from '@/services/authservice';
import { Button, Input, ModalBody, Modal, ModalContent, ModalHeader } from '@heroui/react';
import { useAppSettings, getTokenFromCookie, getLastVisitedPathFromCookie } from '@/contexts/AppContext';
import { LockIcon, MailIcon } from 'lucide-react';
import { ModalFooter } from '@heroui/react';
import { siteConfig } from '@/config/site';
// test 2

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, setAccessToken } = useAppSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      const redirectPath = lastPath && lastPath.startsWith('/notes') ? lastPath : '/notes';
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
        router.push('/');
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        // Create the initial account, then log in with it
        await registerInitialAccount(username, password);
        const data = await login(username, password);
        setAccessToken(data.token);
        setAuthToken(data.token);
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof LoginError) {
        // If no credentials are configured yet, switch to "initial account" mode
        if (!isInitialAccountMode && err.statusCode === 404 && err.message === 'CredentialsNotConfigured') {
          setIsInitialAccountMode(true);
          setError('No account found. Create the initial account to start using the app.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  }

  const { name } = siteConfig;
  return (
    <div className="">
      <img src="/bg_login.webp" alt="Logo" className="h-[100vh] w-full object-cover" />
      <Modal backdrop="blur" isOpen={true} placement="center" hideCloseButton isDismissable={false}>
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex gap-1 items-center"> 
                <img src="/favicon.ico" alt="Logo" className="h-10 w-10" />
                <h2 className="text-2xl font-bold">{name}</h2>
              </ModalHeader>
              <ModalBody>
                <Input
                  endContent={
                    <MailIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                  }
                  label="Username"
                  placeholder="Enter your username"
                  variant="bordered"
                  value={username}
                  onValueChange={setUsername}
                  isRequired
                  isDisabled={loggingIn}
                  autoComplete="username"
                />
                <Input
                  endContent={
                    <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                  }
                  label={isInitialAccountMode ? 'New password' : 'Password'}
                  placeholder={isInitialAccountMode ? 'Enter a new password' : 'Enter your password'}
                  type="password"
                  variant="bordered"
                  value={password}
                  onValueChange={setPassword}
                  isRequired
                  isDisabled={loggingIn}
                  autoComplete="current-password"
                />
                {isInitialAccountMode && (
                  <Input
                    endContent={
                      <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                    }
                    label="Confirm password"
                    placeholder="Re-enter your password"
                    type="password"
                    variant="bordered"
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    isRequired
                    isDisabled={loggingIn}
                    autoComplete="new-password"
                  />
                )}
                {isInitialAccountMode && (
                  <p className="text-xs text-default-500">
                    This will create the initial account and store it securely in your Obsidian vault.
                  </p>
                )}
                {error && (
                  <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-md text-danger-700 dark:text-danger-400 text-sm">
                    {error}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="primary" 
                  type="submit"
                  isDisabled={loggingIn || !username || !password || (isInitialAccountMode && !confirmPassword)}
                  isLoading={loggingIn}
                >
                  {loggingIn
                    ? isInitialAccountMode
                      ? 'Creating account...'
                      : 'Logging in...'
                    : isInitialAccountMode
                      ? 'Create initial account'
                      : 'Sign in'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

