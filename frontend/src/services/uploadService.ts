import { UploadRecord } from '../models/domain';
import { postMultipart } from './apiClient';
import type { UploadResponseDto } from '../types/dto';

export async function uploadImage(file: File, sessionToken: string): Promise<UploadRecord> {
  const formData = new FormData();
  formData.append('image', file);
  if (sessionToken) {
    formData.append('session_token', sessionToken);
  }

  const payload = await postMultipart<UploadResponseDto>('/uploads', formData);
  return UploadRecord.fromDto(payload);
}
