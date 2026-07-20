export interface ApiErrorDto {
  code?: string;
  message?: string;
  details?: unknown;
}

export interface CatalogDto {
  id: string;
  label: string;
  style_count: number;
  default?: boolean;
}

export interface CatalogsResponseDto {
  catalogs: CatalogDto[];
}

export interface StyleDto {
  id: string;
  catalog: string;
  name: string;
  prompt?: string;
  negative_prompt?: string;
  thumbnail_url?: string | null;
}

export interface StylesResponseDto {
  catalog?: {
    id: string;
    label: string;
  };
  styles: StyleDto[];
}

export interface UploadResponseDto {
  upload_id: string;
  session_token: string;
  original_filename: string;
  stored_filename: string;
  mime_type?: string;
  local_url?: string;
  thumbnail_url?: string;
}

export interface JobResultDto {
  stored_filename?: string;
  local_url?: string;
  thumbnail_url?: string;
}

export interface JobStyleDto {
  catalog?: string;
  id?: string;
  name?: string;
}

export interface JobUploadDto {
  upload_id?: string;
  stored_filename?: string;
  local_url?: string;
}

export interface JobPromptDto {
  upstream_prompt_id?: string;
}

export interface JobRecordDto {
  job_id: string;
  session_token?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  upload?: JobUploadDto | null;
  style?: JobStyleDto | null;
  prompt?: JobPromptDto | null;
  result?: JobResultDto | null;
  error?: unknown;
}

export interface RecentJobsResponseDto {
  session_token: string;
  jobs: JobRecordDto[];
}
