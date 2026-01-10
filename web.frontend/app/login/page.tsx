'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/axios';
import { login, LoginError } from '@/services/authservice';
import { Button, Input, ModalBody, Modal, ModalContent, ModalHeader } from '@heroui/react';
import { useAppSettings, getTokenFromCookie } from '@/contexts/AppContext';
import { LockIcon, MailIcon } from 'lucide-react';
import { ModalFooter } from '@heroui/react';

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, setAccessToken } = useAppSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const token = accessToken ?? getTokenFromCookie();
    if (token) {
      if (!accessToken && token) {
        setAccessToken(token);
      }
      router.push('/');
    }
  }, [accessToken, router, setAccessToken]);

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setError(null);
    setLoggingIn(true);

    try {
      const data = await login(username, password);
      setAccessToken(data.token);
      setAuthToken(data.token);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof LoginError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="">
      <img src="/bg_login.webp" alt="Logo" className="h-[100vh] w-full object-cover" />
      <Modal backdrop="blur" isOpen={true} placement="center" hideCloseButton isDismissable={false}>
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex flex-col gap-1">Log in</ModalHeader>
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
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  variant="bordered"
                  value={password}
                  onValueChange={setPassword}
                  isRequired
                  isDisabled={loggingIn}
                  autoComplete="current-password"
                />
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
                  isDisabled={loggingIn || !username || !password}
                  isLoading={loggingIn}
                >
                  {loggingIn ? 'Logging in...' : 'Sign in'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

