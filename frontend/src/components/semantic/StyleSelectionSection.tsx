import { SectionCard } from '../../design-system/SectionCard';
import { StyleOption } from '../../models/domain';
import { StyleGrid } from '../functional/StyleGrid';

interface StyleSelectionSectionProps {
  styles: StyleOption[];
  selectedStyleId: string;
  loadingStyles: boolean;
  selectedStyleName: string;
  onSelectStyle: (styleId: string) => void;
}

export function StyleSelectionSection(props: StyleSelectionSectionProps) {
  return (
    <SectionCard className="reveal-4">
      <StyleGrid {...props} />
    </SectionCard>
  );
}
