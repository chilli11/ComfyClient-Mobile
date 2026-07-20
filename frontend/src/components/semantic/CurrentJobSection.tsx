import { SectionCard } from '../../design-system/SectionCard';
import { JobRecord } from '../../models/domain';
import { JobMetadataAccordion } from '../functional/JobMetadataAccordion';
import { JobResultPanel } from '../functional/JobResultPanel';

interface CurrentJobSectionProps {
  currentJob: JobRecord | null;
}

export function CurrentJobSection({ currentJob }: CurrentJobSectionProps) {
  return (
    <SectionCard className="reveal-5">
      <div className="card-head">
        <h2>Your Current Work</h2>
      </div>
      {!currentJob ? <p className="empty-state">No submitted job yet.</p> : null}
      {currentJob ? (
        <div className="job-details-wrap">
          <JobResultPanel currentJob={currentJob} />
          <JobMetadataAccordion currentJob={currentJob} />
        </div>
      ) : null}
    </SectionCard>
  );
}
