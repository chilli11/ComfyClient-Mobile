import React from 'react';
import ReactDOM from 'react-dom/client';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

function apiUrl(pathname) {
  return `${apiBaseUrl}${pathname}`;
}

async function fetchJson(pathname, options = {}) {
  const response = await fetch(apiUrl(pathname), {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error || 'request_failed');
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

function getStoredSessionToken() {
  try {
    return localStorage.getItem('comfyclient.session_token') || '';
  } catch (error) {
    return '';
  }
}

function setStoredSessionToken(sessionToken) {
  try {
    if (sessionToken) {
      localStorage.setItem('comfyclient.session_token', sessionToken);
    }
  } catch (error) {
    // ignore storage failures in the browser sandbox
  }
}

function App() {
  const [sessionToken, setSessionToken] = React.useState(getStoredSessionToken());
  const [catalogs, setCatalogs] = React.useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = React.useState('');
  const [styles, setStyles] = React.useState([]);
  const [selectedStyleId, setSelectedStyleId] = React.useState('');
  const [uploadRecord, setUploadRecord] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [currentJob, setCurrentJob] = React.useState(null);
  const [statusMessage, setStatusMessage] = React.useState('Load an image to begin.');
  const [busy, setBusy] = React.useState(false);

  const selectedStyle = React.useMemo(
    () => styles.find(style => style.id === selectedStyleId) || null,
    [styles, selectedStyleId]
  );

  React.useEffect(() => {
    let active = true;

    async function loadCatalogs() {
      try {
        const payload = await fetchJson('/styles/catalogs');
        if (!active) {
          return;
        }

        const nextCatalogs = payload.catalogs || [];
        setCatalogs(nextCatalogs);
        const defaultCatalog = nextCatalogs.find(catalog => catalog.default) || nextCatalogs[0] || null;
        if (defaultCatalog) {
          setSelectedCatalogId(defaultCatalog.id);
        }
      } catch (error) {
        if (active) {
          setStatusMessage('Could not load style catalogs.');
        }
      }
    }

    loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedCatalogId) {
      return;
    }

    let active = true;

    async function loadStyles() {
      setBusy(true);
      try {
        const payload = await fetchJson(`/styles?catalog=${encodeURIComponent(selectedCatalogId)}`);
        if (!active) {
          return;
        }

        setStyles(payload.styles || []);
        setSelectedStyleId(payload.styles?.[0]?.id || '');
        setStatusMessage(`Loaded ${payload.catalog?.label || selectedCatalogId}.`);
      } catch (error) {
        if (active) {
          setStyles([]);
          setSelectedStyleId('');
          setStatusMessage('Could not load styles for the selected catalog.');
        }
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    }

    loadStyles();

    return () => {
      active = false;
    };
  }, [selectedCatalogId]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setBusy(true);
    setStatusMessage('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (sessionToken) {
        formData.append('session_token', sessionToken);
      }

      const response = await fetch(apiUrl('/uploads'), {
        method: 'POST',
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'upload_failed');
      }

      setUploadRecord(payload);
      setSessionToken(payload.session_token || sessionToken);
      setStoredSessionToken(payload.session_token || sessionToken);
      setStatusMessage(`Uploaded as ${payload.stored_filename}.`);
    } catch (error) {
      setUploadRecord(null);
      setStatusMessage(`Upload failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitJob() {
    if (!uploadRecord || !selectedStyle) {
      return;
    }

    setBusy(true);
    setStatusMessage('Submitting job to ComfyUI...');

    try {
      const payload = await fetchJson('/jobs/style-transfer', {
        method: 'POST',
        body: JSON.stringify({
          session_token: sessionToken,
          upload_id: uploadRecord.upload_id,
          catalog: selectedCatalogId,
          style_id: selectedStyle.id
        })
      });

      setCurrentJob(payload);
      setStatusMessage(`Job ${payload.job_id} queued.`);
    } catch (error) {
      setStatusMessage(`Job submission failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={stylesApp.page}>
      <section style={stylesApp.hero}>
        <div>
          <p style={stylesApp.kicker}>ComfyClient</p>
          <h1 style={stylesApp.title}>Upload, choose a style, submit.</h1>
          <p style={stylesApp.copy}>
            React frontend running in Docker against an isolated backend API.
          </p>
        </div>
        <div style={stylesApp.statusCard}>
          <div style={stylesApp.statusLabel}>Status</div>
          <div style={stylesApp.statusMessage}>{statusMessage}</div>
          {selectedFile ? <div style={stylesApp.smallMeta}>Selected file: {selectedFile.name}</div> : null}
        </div>
      </section>

      <section style={stylesApp.panel}>
        <h2 style={stylesApp.sectionTitle}>1. Upload</h2>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={busy} />
        {uploadRecord ? (
          <div style={stylesApp.summaryGrid}>
            <div>
              <div style={stylesApp.summaryLabel}>Stored filename</div>
              <div>{uploadRecord.stored_filename}</div>
            </div>
            <div>
              <div style={stylesApp.summaryLabel}>Thumbnail</div>
              <img src={uploadRecord.thumbnail_url} alt="Uploaded thumbnail" style={stylesApp.thumb} />
            </div>
          </div>
        ) : null}
      </section>

      <section style={stylesApp.panel}>
        <h2 style={stylesApp.sectionTitle}>2. Catalog</h2>
        <div style={stylesApp.catalogRow}>
          {catalogs.map(catalog => (
            <button
              key={catalog.id}
              type="button"
              onClick={() => setSelectedCatalogId(catalog.id)}
              style={{
                ...stylesApp.catalogButton,
                ...(selectedCatalogId === catalog.id ? stylesApp.catalogButtonActive : null)
              }}
            >
              <strong>{catalog.label}</strong>
              <span>{catalog.style_count} styles</span>
            </button>
          ))}
        </div>

        <div style={stylesApp.styleGrid}>
          {styles.map(style => (
            <button
              key={style.id}
              type="button"
              onClick={() => setSelectedStyleId(style.id)}
              style={{
                ...stylesApp.styleCard,
                ...(selectedStyleId === style.id ? stylesApp.styleCardActive : null)
              }}
            >
              <img src={style.thumbnail_url} alt={style.name} style={stylesApp.styleImage} />
              <span style={stylesApp.styleName}>{style.name}</span>
            </button>
          ))}
        </div>

        {selectedStyle ? <p style={stylesApp.selectionText}>Selected: {selectedStyle.name}</p> : null}
      </section>

      <section style={stylesApp.panel}>
        <h2 style={stylesApp.sectionTitle}>3. Submit</h2>
        <button
          type="button"
          onClick={submitJob}
          disabled={busy || !uploadRecord || !selectedStyle}
          style={stylesApp.submitButton}
        >
          Submit style-transfer job
        </button>
        {currentJob ? (
          <div style={stylesApp.jobCard}>
            <div><strong>Job:</strong> {currentJob.job_id}</div>
            <div><strong>Status:</strong> {currentJob.status}</div>
            <div><strong>Prompt:</strong> {currentJob.prompt?.upstream_prompt_id || 'pending'}</div>
            {currentJob.upload?.local_url ? (
              <div>
                <strong>Upload:</strong>{' '}
                <a href={currentJob.upload.local_url} target="_blank" rel="noreferrer" style={stylesApp.link}>
                  {currentJob.upload.local_url}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

const stylesApp = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
    background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
    color: '#e5e7eb'
  },
  hero: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'minmax(0, 1fr)',
    marginBottom: '20px'
  },
  kicker: {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#93c5fd',
    fontSize: '12px'
  },
  title: {
    margin: '8px 0 0',
    fontSize: 'clamp(32px, 5vw, 56px)',
    lineHeight: 1.05
  },
  copy: {
    color: '#cbd5e1',
    maxWidth: '56ch'
  },
  statusCard: {
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '18px',
    padding: '16px'
  },
  statusLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.12em'
  },
  statusMessage: {
    marginTop: '8px',
    fontSize: '16px'
  },
  smallMeta: {
    marginTop: '8px',
    color: '#94a3b8',
    fontSize: '13px'
  },
  panel: {
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '20px',
    padding: '18px',
    marginBottom: '16px'
  },
  sectionTitle: {
    marginTop: 0
  },
  summaryGrid: {
    marginTop: '16px',
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '4px'
  },
  thumb: {
    width: '100%',
    maxWidth: '220px',
    borderRadius: '12px',
    display: 'block'
  },
  catalogRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  catalogButton: {
    border: '1px solid rgba(148, 163, 184, 0.25)',
    borderRadius: '999px',
    padding: '10px 14px',
    background: 'rgba(30, 41, 59, 0.85)',
    color: '#e2e8f0',
    display: 'grid',
    gap: '2px',
    cursor: 'pointer'
  },
  catalogButtonActive: {
    background: '#2563eb',
    borderColor: '#60a5fa'
  },
  styleGrid: {
    display: 'grid',
    gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'
  },
  styleCard: {
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '16px',
    padding: '10px',
    background: 'rgba(30, 41, 59, 0.72)',
    color: '#f8fafc',
    cursor: 'pointer',
    display: 'grid',
    gap: '10px',
    textAlign: 'left'
  },
  styleCardActive: {
    borderColor: '#60a5fa',
    boxShadow: '0 0 0 2px rgba(96, 165, 250, 0.18) inset'
  },
  styleImage: {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: '12px',
    background: '#020617'
  },
  styleName: {
    fontSize: '14px',
    lineHeight: 1.3
  },
  selectionText: {
    marginTop: '12px',
    color: '#93c5fd'
  },
  submitButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '14px 18px',
    background: '#22c55e',
    color: '#052e16',
    fontWeight: 700,
    cursor: 'pointer'
  },
  jobCard: {
    marginTop: '16px',
    background: 'rgba(2, 6, 23, 0.5)',
    borderRadius: '14px',
    padding: '14px',
    display: 'grid',
    gap: '8px'
  },
  link: {
    color: '#93c5fd'
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
