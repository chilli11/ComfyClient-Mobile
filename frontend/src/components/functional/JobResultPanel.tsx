import { JobRecord } from '../../models/domain';

interface JobResultPanelProps {
  currentJob: JobRecord;
}

export function JobResultPanel({ currentJob }: JobResultPanelProps) {
  if (!currentJob.result?.localUrl) {
    return null;
  }

  const downloadName = currentJob.result.storedFilename || `${currentJob.jobId}.jpg`;

  return (
    <div className="result-panel">
      <a className="result-hero-link" href={currentJob.result.localUrl} target="_blank" rel="noreferrer">
        <img
          className="result-hero"
          src={currentJob.result.thumbnailUrl || currentJob.result.localUrl}
          alt="Generated style transfer output"
        />
      </a>
      <div className="result-actions">
        <a className="ghost-button result-download" href={currentJob.result.localUrl} download={downloadName}>
          Download Image
        </a>
      </div>
    </div>
  );
}