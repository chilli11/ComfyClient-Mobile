import { SectionCard } from '../../design-system/SectionCard';
import { JobRecord } from '../../models/domain';
import { JobDetails } from '../functional/JobDetails';

interface CurrentJobSectionProps {
  currentJob: JobRecord | null;
}

export function CurrentJobSection({ currentJob }: CurrentJobSectionProps) {
  return (
    <SectionCard className="reveal-5">
      <h2>4. Track Job</h2>
      <JobDetails currentJob={currentJob} />
    </SectionCard>
  );
}
