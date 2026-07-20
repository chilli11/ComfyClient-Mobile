import type { ReactNode } from 'react';

interface SectionCardProps {
  className?: string;
  children: ReactNode;
}

export function SectionCard({ className = '', children }: SectionCardProps) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}
