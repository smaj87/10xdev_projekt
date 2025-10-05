import { ErrorInfo } from 'components/utils/react';
import {
  ABORT_CAUSE_CODE,
  FETCH_FAILURE_CAUSE_CODE,
  RequestError,
} from 'components/utils/request';

const sendMsg = async (msg = '', errorStackTrace = '', infoStackTrace = '') => {
  // @ts-ignore
  // @ts-ignore
  try {
    if (process.env.NODE_ENV === 'production') {
      // todo send to logger service
    } else {
      // eslint-disable-next-line no-console
      console.error(
        msg,
        errorStackTrace,
        infoStackTrace,
        window.version || 'unknown',
        process.env.LOGGER_APP_NAME,
        process.env.LOGGER_URL,
      );
    }
  } catch {}
};

export const reportCatchError = async (error: Error, info: ErrorInfo) => {
  await sendMsg(error?.message, error?.stack, info?.componentStack);
};

export const reportCatchErrorFromAction = async (error: Error) => {
  if (
    error?.message &&
    ![FETCH_FAILURE_CAUSE_CODE, ABORT_CAUSE_CODE].includes(
      (error?.cause as RequestError['cause']) || '',
    )
  ) {
    await sendMsg(error?.message ? `CUSTOM_${error?.message}` : '');
  }
};
