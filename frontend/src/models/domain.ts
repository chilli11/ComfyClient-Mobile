import type {
  CatalogDto,
  JobRecordDto,
  StyleDto,
  UploadResponseDto
} from '../types/dto';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | string;
export type StatusTone = 'status-positive' | 'status-warn' | 'status-negative' | 'status-neutral';

export class SessionInfo {
  constructor(public readonly token: string) {}

  get formattedToken(): string {
    if (!this.token) {
      return 'not issued';
    }

    if (this.token.length <= 14) {
      return this.token;
    }

    return `${this.token.slice(0, 8)}...${this.token.slice(-4)}`;
  }
}

export class StatusMessage {
  constructor(
    public readonly text: string,
    public readonly tone: StatusTone = 'status-neutral'
  ) {}
}

export class StyleCatalog {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly styleCount: number,
    public readonly isDefault: boolean
  ) {}

  static fromDto(dto: CatalogDto): StyleCatalog {
    return new StyleCatalog(dto.id, dto.label, dto.style_count, Boolean(dto.default));
  }
}

export class StyleOption {
  constructor(
    public readonly id: string,
    public readonly catalog: string,
    public readonly name: string,
    public readonly thumbnailUrl: string
  ) {}

  static fromDto(dto: StyleDto): StyleOption {
    return new StyleOption(dto.id, dto.catalog, dto.name, dto.thumbnail_url || '');
  }
}

export class UploadRecord {
  constructor(
    public readonly uploadId: string,
    public readonly sessionToken: string,
    public readonly originalFilename: string,
    public readonly storedFilename: string,
    public readonly thumbnailUrl: string,
    public readonly localUrl: string
  ) {}

  static fromDto(dto: UploadResponseDto): UploadRecord {
    return new UploadRecord(
      dto.upload_id,
      dto.session_token,
      dto.original_filename,
      dto.stored_filename,
      dto.thumbnail_url || '',
      dto.local_url || ''
    );
  }
}

export class JobResult {
  constructor(
    public readonly localUrl: string,
    public readonly thumbnailUrl: string,
    public readonly storedFilename: string
  ) {}
}

export class JobRecord {
  constructor(
    public readonly jobId: string,
    public readonly status: JobStatus,
    public readonly sessionToken: string,
    public readonly styleName: string,
    public readonly upstreamPromptId: string,
    public readonly uploadLocalUrl: string,
    public readonly result: JobResult | null,
    public readonly errorText: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  get isTerminal(): boolean {
    return this.status === 'completed' || this.status === 'failed';
  }

  get statusTone(): StatusTone {
    if (this.status === 'completed') {
      return 'status-positive';
    }

    if (this.status === 'failed') {
      return 'status-negative';
    }

    if (this.status === 'running' || this.status === 'queued') {
      return 'status-warn';
    }

    return 'status-neutral';
  }

  static fromDto(dto: JobRecordDto): JobRecord {
    const result = dto.result
      ? new JobResult(
          dto.result.local_url || '',
          dto.result.thumbnail_url || '',
          dto.result.stored_filename || ''
        )
      : null;

    return new JobRecord(
      dto.job_id,
      dto.status,
      dto.session_token || '',
      dto.style?.name || '',
      dto.prompt?.upstream_prompt_id || '',
      dto.upload?.local_url || '',
      result,
      dto.error ? String(dto.error) : '',
      dto.created_at || '',
      dto.updated_at || ''
    );
  }
}
