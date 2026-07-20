import { StyleCatalog } from '../../models/domain';

interface CatalogChipsProps {
  catalogs: StyleCatalog[];
  selectedCatalogId: string;
  loadingCatalogs: boolean;
  onSelectCatalog: (catalogId: string) => void;
}

export function CatalogChips({
  catalogs,
  selectedCatalogId,
  loadingCatalogs,
  onSelectCatalog
}: CatalogChipsProps) {
  return (
    <div className="chip-row">
      {loadingCatalogs ? <p className="empty-state">Loading catalogs...</p> : null}
      {!loadingCatalogs && catalogs.length === 0 ? <p className="empty-state">No catalogs found.</p> : null}
      {catalogs.map(catalog => (
        <button
          key={catalog.id}
          type="button"
          className={`chip ${selectedCatalogId === catalog.id ? 'chip-active' : ''}`}
          onClick={() => onSelectCatalog(catalog.id)}
        >
          {catalog.label}
          <small>{catalog.styleCount} styles</small>
        </button>
      ))}
    </div>
  );
}
