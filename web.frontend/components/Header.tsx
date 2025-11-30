import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

export default function Header({ children, className }: HeaderProps) {
  return (
    <div className={twMerge('p-4 bg-background text-foreground border-b border-gray-300 h-20', className)}>
      {children}
    </div>
  );
}

