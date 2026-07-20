import {
  JobRecord,
  SessionInfo,
  StatusMessage,
  StyleCatalog,
  StyleOption,
  UploadRecord
} from '../models/domain';

export interface AppState {
  session: SessionInfo;
  catalogs: StyleCatalog[];
  selectedCatalogId: string;
  styles: StyleOption[];
  selectedStyleId: string;
  uploadRecord: UploadRecord | null;
  localPreviewUrl: string;
  selectedFileName: string;
  currentJob: JobRecord | null;
  recentJobs: JobRecord[];
  loadingCatalogs: boolean;
  loadingStyles: boolean;
  uploading: boolean;
  submitting: boolean;
  pollingJob: boolean;
  loadingRecent: boolean;
  status: StatusMessage;
}

export type AppAction =
  | { type: 'LOAD_CATALOGS_START' }
  | { type: 'LOAD_CATALOGS_SUCCESS'; catalogs: StyleCatalog[]; selectedCatalogId: string }
  | { type: 'LOAD_CATALOGS_ERROR'; message: string }
  | { type: 'SELECT_CATALOG'; catalogId: string }
  | { type: 'LOAD_STYLES_START' }
  | { type: 'LOAD_STYLES_SUCCESS'; styles: StyleOption[] }
  | { type: 'LOAD_STYLES_ERROR'; message: string }
  | { type: 'SELECT_STYLE'; styleId: string }
  | { type: 'UPLOAD_START'; fileName: string; localPreviewUrl: string }
  | { type: 'UPLOAD_SUCCESS'; uploadRecord: UploadRecord; sessionToken: string }
  | { type: 'UPLOAD_ERROR'; message: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; job: JobRecord }
  | { type: 'SUBMIT_ERROR'; message: string }
  | { type: 'SET_CURRENT_JOB'; job: JobRecord | null }
  | { type: 'POLLING_ACTIVE'; active: boolean }
  | { type: 'REFRESH_JOB_SUCCESS'; job: JobRecord }
  | { type: 'SET_STATUS'; status: StatusMessage }
  | { type: 'LOAD_RECENT_START' }
  | { type: 'LOAD_RECENT_SUCCESS'; jobs: JobRecord[] }
  | { type: 'LOAD_RECENT_ERROR' };

export function createInitialState(sessionToken: string): AppState {
  return {
    session: new SessionInfo(sessionToken),
    catalogs: [],
    selectedCatalogId: '',
    styles: [],
    selectedStyleId: '',
    uploadRecord: null,
    localPreviewUrl: '',
    selectedFileName: '',
    currentJob: null,
    recentJobs: [],
    loadingCatalogs: false,
    loadingStyles: false,
    uploading: false,
    submitting: false,
    pollingJob: false,
    loadingRecent: false,
    status: new StatusMessage('Choose an image to begin your style transfer.')
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_CATALOGS_START':
      return { ...state, loadingCatalogs: true };
    case 'LOAD_CATALOGS_SUCCESS':
      return {
        ...state,
        loadingCatalogs: false,
        catalogs: action.catalogs,
        selectedCatalogId: action.selectedCatalogId,
        status: new StatusMessage('Catalogs ready. Pick a style set to continue.', 'status-neutral')
      };
    case 'LOAD_CATALOGS_ERROR':
      return {
        ...state,
        loadingCatalogs: false,
        status: new StatusMessage(`Could not load style catalogs: ${action.message}`, 'status-negative')
      };
    case 'SELECT_CATALOG':
      return { ...state, selectedCatalogId: action.catalogId };
    case 'LOAD_STYLES_START':
      return { ...state, loadingStyles: true };
    case 'LOAD_STYLES_SUCCESS':
      return {
        ...state,
        loadingStyles: false,
        styles: action.styles,
        selectedStyleId: action.styles[0]?.id || ''
      };
    case 'LOAD_STYLES_ERROR':
      return {
        ...state,
        loadingStyles: false,
        styles: [],
        selectedStyleId: '',
        status: new StatusMessage(`Could not load styles: ${action.message}`, 'status-negative')
      };
    case 'SELECT_STYLE':
      return { ...state, selectedStyleId: action.styleId };
    case 'UPLOAD_START':
      return {
        ...state,
        selectedFileName: action.fileName,
        localPreviewUrl: action.localPreviewUrl,
        currentJob: null,
        uploading: true,
        status: new StatusMessage('Uploading image as canonical JPEG...', 'status-warn')
      };
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        uploading: false,
        uploadRecord: action.uploadRecord,
        session: new SessionInfo(action.sessionToken),
        status: new StatusMessage(`Upload complete: ${action.uploadRecord.storedFilename}`, 'status-positive')
      };
    case 'UPLOAD_ERROR':
      return {
        ...state,
        uploading: false,
        uploadRecord: null,
        status: new StatusMessage(`Upload failed: ${action.message}`, 'status-negative')
      };
    case 'SUBMIT_START':
      return {
        ...state,
        submitting: true,
        status: new StatusMessage('Submitting style-transfer job...', 'status-warn')
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitting: false,
        currentJob: action.job,
        status: new StatusMessage(`Job queued: ${action.job.jobId}`, 'status-warn')
      };
    case 'SUBMIT_ERROR':
      return {
        ...state,
        submitting: false,
        status: new StatusMessage(`Job submission failed: ${action.message}`, 'status-negative')
      };
    case 'SET_CURRENT_JOB':
      return { ...state, currentJob: action.job };
    case 'POLLING_ACTIVE':
      return { ...state, pollingJob: action.active };
    case 'REFRESH_JOB_SUCCESS':
      return { ...state, currentJob: action.job };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'LOAD_RECENT_START':
      return { ...state, loadingRecent: true };
    case 'LOAD_RECENT_SUCCESS':
      return { ...state, loadingRecent: false, recentJobs: action.jobs };
    case 'LOAD_RECENT_ERROR':
      return { ...state, loadingRecent: false, recentJobs: [] };
    default:
      return state;
  }
}
