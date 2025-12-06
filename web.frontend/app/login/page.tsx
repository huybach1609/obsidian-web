'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/axios';
import { login } from '@/services/authservice';
import { Button, Input } from '@heroui/react';
import { useAppSettings, getTokenFromCookie } from '@/contexts/AppContext';

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);

    try {
      debugger;
      const data = await login(username, password);


      setAccessToken(data.token);
      setAuthToken(data.token);
      router.push('/');

    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch')) {
        setError('Cannot connect to backend. Please check if the server is running.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Login
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loggingIn}
              className="text-black "
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loggingIn}
              className=""
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loggingIn || !username || !password}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-none rounded-md text-base font-medium transition-colors"
          >
            {loggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

