import { SessionInfo } from '../../models/domain';

interface TopBarProps {
  session: SessionInfo;
}

export function TopBar({ session }: TopBarProps) {
  return (
    <header className="top-bar reveal-0">
      <div>
        <p className="top-kicker">ComfyClient Mobile</p>
        <h1>Style Transfer</h1>
        <p className="top-copy">Upload an image, pick a catalog and style, then submit your backend-owned job.</p>
      </div>
      <div className="session-pill">
        <span>Session</span>
        <strong>{session.formattedToken}</strong>
      </div>
    </header>
  );
}
