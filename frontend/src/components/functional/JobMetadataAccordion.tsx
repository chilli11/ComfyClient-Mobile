import { JobRecord } from '../../models/domain';
import { StatusPill } from '../../design-system/StatusPill';

interface JobMetadataAccordionProps {
  currentJob: JobRecord;
}

export function JobMetadataAccordion({ currentJob }: JobMetadataAccordionProps) {
  return (
    <details className="job-details-accordion">
      <summary className="job-details-summary">
        <span>Job Details</span>
        <StatusPill text={currentJob.status} toneClass={currentJob.statusTone} />
      </summary>
      <div className="job-details">
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
    </details>
  );
}