interface StickySubmitBarProps {
  submitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

export function StickySubmitBar({ submitting, disabled, onSubmit }: StickySubmitBarProps) {
  return (
    <footer className="sticky-submit">
      <button type="button" onClick={onSubmit} disabled={disabled} className="primary-submit">
        {submitting ? 'Submitting...' : 'Submit style-transfer job'}
      </button>
    </footer>
  );
}
