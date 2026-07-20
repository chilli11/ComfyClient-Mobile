interface StatusPillProps {
  text: string;
  toneClass: string;
}

export function StatusPill({ text, toneClass }: StatusPillProps) {
  return <span className={`status-pill ${toneClass}`}>{text}</span>;
}
