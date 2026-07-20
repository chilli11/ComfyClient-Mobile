import React from 'react';
import { JobRecord, StatusMessage, StyleOption } from '../models/domain';
import { getJob, getRecentJobs, submitStyleTransferJob } from '../services/jobsService';
import { getStoredSessionToken, setStoredSessionToken } from '../services/sessionService';
import { getCatalogs, getStylesByCatalog } from '../services/stylesService';
import { uploadImage } from '../services/uploadService';
import { appReducer, createInitialState } from './appReducer';

interface AppActions {
  selectCatalog: (catalogId: string) => void;
  selectStyle: (styleId: string) => void;
  uploadFile: (file: File) => Promise<void>;
  submitJob: () => Promise<void>;
  refreshRecentJobs: (tokenOverride?: string) => Promise<void>;
  selectCurrentJob: (job: JobRecord | null) => void;
}

interface AppContextValue {
  state: ReturnType<typeof createInitialState>;
  actions: AppActions;
  selectedStyle: StyleOption | null;
  submitDisabled: boolean;
}

const AppContext = React.createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(appReducer, createInitialState(getStoredSessionToken()));

  const selectedStyle = React.useMemo(
    () => state.styles.find(style => style.id === state.selectedStyleId) || null,
    [state.styles, state.selectedStyleId]
  );

  const submitDisabled = !state.uploadRecord || !selectedStyle || state.uploading || state.submitting;

  React.useEffect(() => {
    let cancelled = false;

    async function loadCatalogs() {
      dispatch({ type: 'LOAD_CATALOGS_START' });
      try {
        const catalogs = await getCatalogs();
        if (cancelled) {
          return;
        }

        const defaultCatalog = catalogs.find(catalog => catalog.isDefault) || catalogs[0];
        dispatch({
          type: 'LOAD_CATALOGS_SUCCESS',
          catalogs,
          selectedCatalogId: defaultCatalog?.id || ''
        });
      } catch (error) {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_CATALOGS_ERROR',
            message: error instanceof Error ? error.message : 'request_failed'
          });
        }
      }
    }

    loadCatalogs();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!state.selectedCatalogId) {
      return;
    }

    let cancelled = false;

    async function loadStyles() {
      dispatch({ type: 'LOAD_STYLES_START' });
      try {
        const styles = await getStylesByCatalog(state.selectedCatalogId);
        if (cancelled) {
          return;
        }

        dispatch({ type: 'LOAD_STYLES_SUCCESS', styles });
        dispatch({
          type: 'SET_STATUS',
          status: new StatusMessage(`Loaded ${state.selectedCatalogId}. Choose your style.`, 'status-neutral')
        });
      } catch (error) {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_STYLES_ERROR',
            message: error instanceof Error ? error.message : 'request_failed'
          });
        }
      }
    }

    loadStyles();
    return () => {
      cancelled = true;
    };
  }, [state.selectedCatalogId]);

  const refreshRecentJobs = React.useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride || state.session.token;
    if (!token) {
      dispatch({ type: 'LOAD_RECENT_SUCCESS', jobs: [] });
      return;
    }

    dispatch({ type: 'LOAD_RECENT_START' });
    try {
      const jobs = await getRecentJobs(token);
      dispatch({ type: 'LOAD_RECENT_SUCCESS', jobs });
    } catch {
      dispatch({ type: 'LOAD_RECENT_ERROR' });
    }
  }, [state.session.token]);

  React.useEffect(() => {
    refreshRecentJobs();
  }, [refreshRecentJobs]);

  React.useEffect(() => {
    if (!state.currentJob || state.currentJob.isTerminal) {
      dispatch({ type: 'POLLING_ACTIVE', active: false });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'POLLING_ACTIVE', active: true });

    const timer = window.setInterval(async () => {
      try {
        const refreshed = await getJob(state.currentJob?.jobId || '');
        if (cancelled) {
          return;
        }

        dispatch({ type: 'REFRESH_JOB_SUCCESS', job: refreshed });

        if (refreshed.status === 'running') {
          dispatch({
            type: 'SET_STATUS',
            status: new StatusMessage(`Job ${refreshed.jobId} is running...`, 'status-warn')
          });
        } else if (refreshed.status === 'completed') {
          dispatch({
            type: 'SET_STATUS',
            status: new StatusMessage(`Job ${refreshed.jobId} completed.`, 'status-positive')
          });
          await refreshRecentJobs();
        } else if (refreshed.status === 'failed') {
          dispatch({
            type: 'SET_STATUS',
            status: new StatusMessage(`Job ${refreshed.jobId} failed.`, 'status-negative')
          });
          await refreshRecentJobs();
        }
      } catch {
        if (!cancelled && state.currentJob) {
          dispatch({
            type: 'SET_STATUS',
            status: new StatusMessage(`Could not refresh job ${state.currentJob.jobId}.`, 'status-negative')
          });
        }
      }
    }, 2400);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [state.currentJob, refreshRecentJobs]);

  React.useEffect(() => {
    return () => {
      if (state.localPreviewUrl) {
        URL.revokeObjectURL(state.localPreviewUrl);
      }
    };
  }, [state.localPreviewUrl]);

  const uploadFile = React.useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    if (state.localPreviewUrl) {
      URL.revokeObjectURL(state.localPreviewUrl);
    }

    dispatch({ type: 'UPLOAD_START', fileName: file.name, localPreviewUrl: previewUrl });

    try {
      const uploadRecord = await uploadImage(file, state.session.token);
      dispatch({
        type: 'UPLOAD_SUCCESS',
        uploadRecord,
        sessionToken: uploadRecord.sessionToken || state.session.token
      });

      setStoredSessionToken(uploadRecord.sessionToken || state.session.token);
      await refreshRecentJobs(uploadRecord.sessionToken || state.session.token);
    } catch (error) {
      dispatch({
        type: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'upload_failed'
      });
    }
  }, [refreshRecentJobs, state.localPreviewUrl, state.session.token]);

  const submitJob = React.useCallback(async () => {
    if (!state.uploadRecord || !selectedStyle || state.submitting || state.uploading) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      const job = await submitStyleTransferJob({
        sessionToken: state.session.token,
        uploadId: state.uploadRecord.uploadId,
        catalogId: state.selectedCatalogId,
        styleId: selectedStyle.id
      });

      dispatch({ type: 'SUBMIT_SUCCESS', job });
      await refreshRecentJobs();
    } catch (error) {
      dispatch({
        type: 'SUBMIT_ERROR',
        message: error instanceof Error ? error.message : 'job_submission_failed'
      });
    }
  }, [refreshRecentJobs, selectedStyle, state.selectedCatalogId, state.session.token, state.submitting, state.uploadRecord, state.uploading]);

  const value: AppContextValue = {
    state,
    actions: {
      selectCatalog: (catalogId: string) => dispatch({ type: 'SELECT_CATALOG', catalogId }),
      selectStyle: (styleId: string) => dispatch({ type: 'SELECT_STYLE', styleId }),
      uploadFile,
      submitJob,
      refreshRecentJobs,
      selectCurrentJob: (job: JobRecord | null) => dispatch({ type: 'SET_CURRENT_JOB', job })
    },
    selectedStyle,
    submitDisabled
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}
