import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface HeaderProps {
  children: ReactNode;
  className?: string;
}

export default function Header({ children, className }: HeaderProps) {
  return (
    <div
      className={twMerge(
        "min-h-20 border-b border-foreground/20 p-4 h-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
