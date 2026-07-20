import { JobRecord } from '../models/domain';
import { fetchJson } from './apiClient';
import type { JobRecordDto, RecentJobsResponseDto } from '../types/dto';

interface SubmitJobInput {
  sessionToken: string;
  uploadId: string;
  catalogId: string;
  styleId: string;
}

export async function submitStyleTransferJob(input: SubmitJobInput): Promise<JobRecord> {
  const payload = await fetchJson<JobRecordDto>('/jobs/style-transfer', {
    method: 'POST',
    body: JSON.stringify({
      session_token: input.sessionToken,
      upload_id: input.uploadId,
      catalog: input.catalogId,
      style_id: input.styleId
    })
  });

  return JobRecord.fromDto(payload);
}

export async function getJob(jobId: string): Promise<JobRecord> {
  const payload = await fetchJson<JobRecordDto>(`/jobs/${encodeURIComponent(jobId)}`);
  return JobRecord.fromDto(payload);
}

export async function getRecentJobs(sessionToken: string): Promise<JobRecord[]> {
  const payload = await fetchJson<RecentJobsResponseDto>(
    `/jobs/recent?session_token=${encodeURIComponent(sessionToken)}`
  );

  return (payload.jobs || []).map(JobRecord.fromDto);
}
