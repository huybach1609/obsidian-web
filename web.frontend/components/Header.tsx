import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

export default function Header({ children, className }: HeaderProps) {
  return (
    <div className={twMerge('p-4  border-b border-foreground/20  h-20', className)}>
      {children}
    </div>
  );
}

