import { StatusMessage } from '../../models/domain';
import { SectionCard } from '../../design-system/SectionCard';
import { SectionHeader } from '../../design-system/SectionHeader';

interface StatusPanelProps {
  status: StatusMessage;
  selectedFileName: string;
  pollingJob: boolean;
}

export function StatusPanel({ status, selectedFileName, pollingJob }: StatusPanelProps) {
  return (
    <SectionCard className="status-card reveal-1">
      <SectionHeader title="Current Status" trailing={<span className={`status-dot ${status.tone}`} />} />
      <p className={`status-text ${status.tone}`}>{status.text}</p>
      <div className="status-meta-row">
        {selectedFileName ? <span>File: {selectedFileName}</span> : <span>No file selected yet</span>}
        {pollingJob ? <span>Polling active</span> : <span>Polling idle</span>}
      </div>
    </SectionCard>
  );
}
