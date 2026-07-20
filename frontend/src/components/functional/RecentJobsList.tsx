import { JobRecord, SessionInfo } from '../../models/domain';
import { StatusPill } from '../../design-system/StatusPill';

interface RecentJobsListProps {
  session: SessionInfo;
  jobs: JobRecord[];
  loadingRecent: boolean;
  onRefresh: () => void;
  onSelectJob: (job: JobRecord) => void;
}

export function RecentJobsList({
  session,
  jobs,
  loadingRecent,
  onRefresh,
  onSelectJob
}: RecentJobsListProps) {
  return (
    <>
      <div className="card-head">
        <h2>Recent Jobs</h2>
        <button type="button" className="ghost-button" onClick={onRefresh} disabled={loadingRecent || !session.token}>
          {loadingRecent ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {!session.token ? <p className="empty-state">Session token will appear after first upload.</p> : null}
      {session.token && jobs.length === 0 && !loadingRecent ? <p className="empty-state">No recent jobs yet.</p> : null}
      <div className="recent-list">
        {jobs.map(job => (
          <button
            key={job.jobId}
            type="button"
            className="recent-item"
            onClick={() => onSelectJob(job)}
          >
            <div className="recent-item-left">
              {job.result?.thumbnailUrl ? (
                <img className="recent-thumb" src={job.result.thumbnailUrl} alt={`Result preview for ${job.jobId}`} />
              ) : null}
              <span>{job.jobId}</span>
            </div>
            <StatusPill text={job.status} toneClass={job.statusTone} />
          </button>
        ))}
      </div>
    </>
  );
}
