import { UploadRecord } from '../../models/domain';

interface UploadControlsProps {
  uploading: boolean;
  submitting: boolean;
  uploadRecord: UploadRecord | null;
  localPreviewUrl: string;
  onFileSelected: (file: File) => void;
}

export function UploadControls({
  uploading,
  submitting,
  uploadRecord,
  localPreviewUrl,
  onFileSelected
}: UploadControlsProps) {
  return (
    <>
      <label className={`upload-cta ${uploading || submitting ? 'is-disabled' : ''}`} htmlFor="image-picker">
        <input
          id="image-picker"
          type="file"
          accept="image/*"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              onFileSelected(file);
            }
          }}
          disabled={uploading || submitting}
        />
        <span>{uploading ? 'Uploading...' : 'Tap to choose image'}</span>
      </label>

      <div className="upload-preview-row">
        <div className="preview-box">
          {uploadRecord?.thumbnailUrl ? (
            <img src={uploadRecord.thumbnailUrl} alt="Uploaded thumbnail" />
          ) : localPreviewUrl ? (
            <img src={localPreviewUrl} alt="Selected image preview" />
          ) : (
            <div className="empty-preview">Preview appears here</div>
          )}
        </div>
        <div className="upload-meta">
          <p><strong>Original:</strong> {uploadRecord?.originalFilename || '-'}</p>
          <p><strong>Stored:</strong> {uploadRecord?.storedFilename || '-'}</p>
          <p><strong>Upload ID:</strong> {uploadRecord?.uploadId || '-'}</p>
        </div>
      </div>
    </>
  );
}
