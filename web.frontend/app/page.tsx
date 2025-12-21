
'use client';
import { redirect } from 'next/navigation';
import '../styles/markdown.css';

export default function Home() {
  redirect('/notes');
}

