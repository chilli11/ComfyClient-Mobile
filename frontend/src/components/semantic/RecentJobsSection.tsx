import { SectionCard } from '../../design-system/SectionCard';
import { JobRecord, SessionInfo } from '../../models/domain';
import { RecentJobsList } from '../functional/RecentJobsList';

interface RecentJobsSectionProps {
  session: SessionInfo;
  jobs: JobRecord[];
  loadingRecent: boolean;
  onRefresh: () => void;
  onSelectJob: (job: JobRecord) => void;
}

export function RecentJobsSection(props: RecentJobsSectionProps) {
  return (
    <SectionCard className="reveal-6">
      <RecentJobsList {...props} />
    </SectionCard>
  );
}
