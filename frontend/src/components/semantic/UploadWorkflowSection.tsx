import { SectionCard } from '../../design-system/SectionCard';
import { UploadRecord } from '../../models/domain';
import { UploadControls } from '../functional/UploadControls';

interface UploadWorkflowSectionProps {
  uploading: boolean;
  submitting: boolean;
  uploadRecord: UploadRecord | null;
  localPreviewUrl: string;
  onFileSelected: (file: File) => void;
}

export function UploadWorkflowSection(props: UploadWorkflowSectionProps) {
  return (
    <SectionCard className="reveal-2">
      <h2>1. Upload Image</h2>
      <p className="section-copy">Your upload is converted to backend canonical JPEG naming.</p>
      <UploadControls {...props} />
    </SectionCard>
  );
}
