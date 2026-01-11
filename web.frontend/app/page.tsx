
'use client';
import { redirect } from 'next/navigation';
import '../styles/markdown.css';
import { useAppSettings } from '@/contexts/AppContext';

export default function Home() {
  const { accessToken } = useAppSettings();
  if (accessToken) {
    redirect('/notes');
  } else {
    redirect('/login');
  }
}

