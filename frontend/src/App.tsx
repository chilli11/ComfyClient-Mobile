import { TopBar } from './components/functional/TopBar';
import { StatusPanel } from './components/functional/StatusPanel';
import { StickySubmitBar } from './components/functional/StickySubmitBar';
import { CatalogSelectionSection } from './components/semantic/CatalogSelectionSection';
import { CurrentJobSection } from './components/semantic/CurrentJobSection';
import { RecentJobsSection } from './components/semantic/RecentJobsSection';
import { StyleSelectionSection } from './components/semantic/StyleSelectionSection';
import { UploadWorkflowSection } from './components/semantic/UploadWorkflowSection';
import { AppProvider, useAppContext } from './state/AppContext';

function AppPage() {
  const { state, actions, selectedStyle, submitDisabled } = useAppContext();
  const isGenerating = state.submitting || Boolean(state.currentJob && !state.currentJob.isTerminal);
  const isResultView = Boolean(state.currentJob && state.currentJob.isTerminal);
  const showWorkflow = !isGenerating && !isResultView;
  const activeStyleLabel = state.currentJob?.styleName || selectedStyle?.name || '-';

  return (
    <div className="app-shell">
      <div className="ambient-shape" aria-hidden="true" />

      <TopBar session={state.session} />

      <main className="content-wrap">
        <StatusPanel
          status={state.status}
          selectedFileName={state.selectedFileName}
          pollingJob={state.pollingJob}
        />

        {showWorkflow ? (
          <>
            <UploadWorkflowSection
              uploading={state.uploading}
              submitting={state.submitting}
              uploadRecord={state.uploadRecord}
              localPreviewUrl={state.localPreviewUrl}
              onFileSelected={actions.uploadFile}
            />

            <CatalogSelectionSection
              catalogs={state.catalogs}
              selectedCatalogId={state.selectedCatalogId}
              loadingCatalogs={state.loadingCatalogs}
              onSelectCatalog={actions.selectCatalog}
            />

            <StyleSelectionSection
              styles={state.styles}
              selectedStyleId={state.selectedStyleId}
              loadingStyles={state.loadingStyles}
              selectedStyleName={selectedStyle?.name || ''}
              onSelectStyle={actions.selectStyle}
            />

            <CurrentJobSection currentJob={state.currentJob} />

            <RecentJobsSection
              session={state.session}
              jobs={state.recentJobs}
              loadingRecent={state.loadingRecent}
              onRefresh={() => actions.refreshRecentJobs()}
              onSelectJob={actions.selectCurrentJob}
            />
          </>
        ) : null}

        {isGenerating ? (
          <section className="card generation-card reveal-3">
            <h2>Generating Your Style Transfer</h2>
            <p className="section-copy">
              Hold tight while Comfy processes your job. This screen updates as your job moves from queued to running.
            </p>
            <div className="generation-summary">
              <div className="preview-box generation-preview">
                {state.uploadRecord?.thumbnailUrl ? (
                  <img src={state.uploadRecord.thumbnailUrl} alt="Uploaded input preview" />
                ) : state.localPreviewUrl ? (
                  <img src={state.localPreviewUrl} alt="Selected input preview" />
                ) : (
                  <div className="empty-preview">Waiting for image preview</div>
                )}
              </div>
              <div className="upload-meta">
                <p><strong>Style:</strong> {activeStyleLabel}</p>
                <p><strong>Job:</strong> {state.currentJob?.jobId || '-'}</p>
                <p><strong>Status:</strong> {state.currentJob?.status || 'submitting'}</p>
              </div>
            </div>
          </section>
        ) : null}

        {isResultView ? (
          <>
            <CurrentJobSection currentJob={state.currentJob} />
            <RecentJobsSection
              session={state.session}
              jobs={state.recentJobs}
              loadingRecent={state.loadingRecent}
              onRefresh={() => actions.refreshRecentJobs()}
              onSelectJob={actions.selectCurrentJob}
            />
            <section className="card reveal-6">
              <button
                type="button"
                className="ghost-button"
                onClick={() => actions.selectCurrentJob(null)}
              >
                Start New Job
              </button>
            </section>
          </>
        ) : null}
      </main>

      {showWorkflow ? (
        <StickySubmitBar
          submitting={state.submitting}
          disabled={submitDisabled}
          onSubmit={actions.submitJob}
        />
      ) : null}
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppPage />
    </AppProvider>
  );
}
