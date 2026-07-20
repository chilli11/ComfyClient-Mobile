import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  trailing?: ReactNode;
}

export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  return (
    <div className="card-head">
      <h2>{title}</h2>
      {trailing || null}
    </div>
  );
}
