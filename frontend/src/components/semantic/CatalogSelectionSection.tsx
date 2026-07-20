import { SectionCard } from '../../design-system/SectionCard';
import { StyleCatalog } from '../../models/domain';
import { CatalogChips } from '../functional/CatalogChips';

interface CatalogSelectionSectionProps {
  catalogs: StyleCatalog[];
  selectedCatalogId: string;
  loadingCatalogs: boolean;
  onSelectCatalog: (catalogId: string) => void;
}

export function CatalogSelectionSection(props: CatalogSelectionSectionProps) {
  return (
    <SectionCard className="reveal-3">
      <h2>2. Choose Catalog</h2>
      <CatalogChips {...props} />
    </SectionCard>
  );
}
