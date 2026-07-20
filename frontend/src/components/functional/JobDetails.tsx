import { JobRecord } from '../../models/domain';
import { StatusPill } from '../../design-system/StatusPill';

interface JobDetailsProps {
  currentJob: JobRecord | null;
}

export function JobDetails({ currentJob }: JobDetailsProps) {
  if (!currentJob) {
    return <p className="empty-state">No submitted job yet.</p>;
  }

  const hasResult = Boolean(currentJob.result?.localUrl);

  return (
    <div className="job-details">
      {hasResult ? (
        <a className="result-hero-link" href={currentJob.result?.localUrl} target="_blank" rel="noreferrer">
          <img
            className="result-hero"
            src={currentJob.result?.thumbnailUrl || currentJob.result?.localUrl}
            alt="Generated style transfer output"
          />
        </a>
      ) : null}
      <p><strong>Job:</strong> {currentJob.jobId}</p>
      <p>
        <strong>Status:</strong>{' '}
        <StatusPill text={currentJob.status} toneClass={currentJob.statusTone} />
      </p>
      <p><strong>Prompt ID:</strong> {currentJob.upstreamPromptId || '-'}</p>
      <p><strong>Style:</strong> {currentJob.styleName || '-'}</p>
      {currentJob.uploadLocalUrl ? (
        <p>
          <strong>Upload URL:</strong>{' '}
          <a href={currentJob.uploadLocalUrl} target="_blank" rel="noreferrer">
            {currentJob.uploadLocalUrl}
          </a>
        </p>
      ) : null}
      {currentJob.result?.localUrl ? (
        <p>
          <strong>Result URL:</strong>{' '}
          <a href={currentJob.result.localUrl} target="_blank" rel="noreferrer">
            {currentJob.result.localUrl}
          </a>
        </p>
      ) : null}
      {currentJob.errorText ? <p className="status-negative"><strong>Error:</strong> {currentJob.errorText}</p> : null}
    </div>
  );
}
