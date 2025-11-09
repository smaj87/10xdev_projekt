import { ErrorInfo } from 'components/utils/react';
import {
  ABORT_CAUSE_CODE,
  CHECK_STATUS_CAUSE_CODE,
  FETCH_FAILURE_CAUSE_CODE,
  RequestError,
} from 'components/utils/request';

const recentErrors = new Map<string, number>(); // msg -> timestamp
const DEDUP_WINDOW_MS = 3000;

interface ErrorReportPayload {
  msg: string;
  errorStackTrace?: string;
  infoStackTrace?: string;
  url?: string;
  userAgent?: string;
  ts: string;
  appVersion?: string;
  loggerApp?: string;
}

const buildErrorPayload = (
  msg = '',
  errorStackTrace = '',
  infoStackTrace = '',
): ErrorReportPayload => {
  const now = new Date();
  return {
    msg,
    errorStackTrace,
    infoStackTrace,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ts: now.toISOString(),
    appVersion: (window as any)?.version || 'unknown',
    loggerApp: process.env.LOGGER_APP_NAME,
  };
};

const shouldSkipDueToDedup = (msg: string) => {
  const previousTs = recentErrors.get(msg) || 0;
  const now = Date.now();
  if (now - previousTs < DEDUP_WINDOW_MS) {
    return true;
  }
  recentErrors.set(msg, now);
  return false;
};

const sendMsg = async (msg = '', errorStackTrace = '', infoStackTrace = '') => {
  try {
    if (!msg) {
      return;
    } // nic nie wysyłamy dla pustych komunikatów
    if (shouldSkipDueToDedup(msg)) {
      return;
    } // deduplikacja krótkookresowa
    const payload = buildErrorPayload(msg, errorStackTrace, infoStackTrace);
    if (process.env.NODE_ENV === 'production') {
      // TODO: wysyłka np. fetch(process.env.LOGGER_URL, { method: 'POST', body: JSON.stringify(payload) })
    } else {
      // eslint-disable-next-line no-console
      console.error('[ErrorReport]', payload);
    }
  } catch {
    // swallow secondary errors
  }
};

export const reportCatchError = async (error: Error, info: ErrorInfo) => {
  await sendMsg(error?.message, error?.stack, info?.componentStack);
};

export const reportCatchErrorFromAction = async (error: Error) => {
  if (
    error?.message &&
    ![
      FETCH_FAILURE_CAUSE_CODE,
      ABORT_CAUSE_CODE,
      CHECK_STATUS_CAUSE_CODE,
    ].includes((error?.cause as RequestError['cause']) || '')
  ) {
    await sendMsg(
      error?.message ? `CUSTOM_${error?.message}` : 'CUSTOM_UNKNOWN',
    );
  }
};
