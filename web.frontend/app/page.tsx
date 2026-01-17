
'use client';
import { redirect } from 'next/navigation';
import '../styles/markdown.css';
import { useAppSettings, getLastVisitedPathFromCookie } from '@/contexts/AppContext';

export default function Home() {
  const { accessToken } = useAppSettings();
  if (accessToken) {
    const lastPath = getLastVisitedPathFromCookie();
    const redirectPath = lastPath && lastPath.startsWith('/notes') ? lastPath : '/notes';
    redirect(redirectPath);
  } else {
    redirect('/login');
  }
}

