import { StyleOption } from '../../models/domain';

interface StyleGridProps {
  styles: StyleOption[];
  selectedStyleId: string;
  loadingStyles: boolean;
  selectedStyleName: string;
  onSelectStyle: (styleId: string) => void;
}

export function StyleGrid({
  styles,
  selectedStyleId,
  loadingStyles,
  selectedStyleName,
  onSelectStyle
}: StyleGridProps) {
  return (
    <>
      <div className="card-head">
        <h2>3. Pick Style</h2>
        {selectedStyleName ? <span className="selected-style">Selected: {selectedStyleName}</span> : null}
      </div>
      {loadingStyles ? <p className="empty-state">Loading styles...</p> : null}
      {!loadingStyles && styles.length === 0 ? <p className="empty-state">No styles found in this catalog.</p> : null}

      <div className="styles-scroll" role="region" aria-label="Style thumbnails">
        <div className="styles-grid">
          {styles.map(style => (
            <button
              key={style.id}
              type="button"
              className={`style-card ${selectedStyleId === style.id ? 'style-card-active' : ''}`}
              onClick={() => onSelectStyle(style.id)}
            >
              <img src={style.thumbnailUrl} alt={style.name} loading="lazy" />
              <span>{style.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
