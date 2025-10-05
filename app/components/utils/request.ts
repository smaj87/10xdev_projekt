export const ABORT_ERROR_NAME = 'Abort' as const;
export const CHECK_STATUS_CAUSE_CODE = 'WRONG_STATUS_CODE' as const;
export const FETCH_FAILURE_CAUSE_CODE = 'FETCH_FAILURE_CODE' as const;
export const ABORT_CAUSE_CODE = 'ABORT_CODE' as const;

export interface RequestError extends Error {
  status: number;
  cause:
    | typeof CHECK_STATUS_CAUSE_CODE
    | typeof FETCH_FAILURE_CAUSE_CODE
    | typeof ABORT_CAUSE_CODE;
}

/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
const parse = (response: Response) => {
  if (response.status === 204 || response.status === 205) {
    return [];
  }

  const contentType = (response.headers.get('content-type') || '').split(
    ';',
  )[0]; // split ';' for 'text/plant; charset=UTF8'

  switch (contentType.split('/')[0]) {
    case 'text':
      return response.text();
    case 'application': {
      if (contentType === 'application/json') {
        return response.json();
      }

      return response.blob();
    }
    default:
      try {
        return response.json();
      } catch {
        return [];
      }
  }
};

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */
const checkStatus = (response: Response) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  if (response.status === 403) {
    // todo auth redirect
  }

  const err = new Error(
    `${response.status} ${response.statusText} (${response.url})`,
    { cause: CHECK_STATUS_CAUSE_CODE },
  ) as RequestError;

  err.status = response.status;

  throw err;
};

const onCatch = (error: RequestError) => {
  if (error.cause === CHECK_STATUS_CAUSE_CODE) {
    throw error;
  } else {
    const err = new Error('Fetch Failure', {
      cause: FETCH_FAILURE_CAUSE_CODE,
    }) as RequestError;

    err.status = error.status;

    throw err;
  }
};

const requestOptions: object = {
  method: 'GET',
  credentials: 'include',
  body: {},
};

const requestHeaders: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const getBody = (method?: string, body?: BodyInit | null) =>
  method === 'GET' || method === 'HEAD' ? null : JSON.stringify(body);

const getRequest = (
  url: string,
  options?: RequestInit,
  withPreload = false,
) => {
  const combinedOptions = { ...requestOptions, ...options };

  if (!withPreload) {
    combinedOptions.headers = { ...requestHeaders, ...combinedOptions.headers };
  }

  return new Request(url, {
    ...combinedOptions,
    body: getBody(combinedOptions.method, combinedOptions.body),
  });
};

export const xhrUpload = (
  url: string,
  file: any,
  headers: any = {},
  nameOfFiles = 'file[]',
  onProgress = (_: ProgressEvent) => {},
  onAbort = () => {},
  onError = () => {},
  controller?: AbortController,
) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = onProgress;
    xhr.upload.onabort = onAbort;
    xhr.upload.onerror = onError;

    formData.append(nameOfFiles, file);

    xhr.open('post', url, true);
    xhr.withCredentials = true;

    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 400) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr);
      }
    };

    const abortListener = () => {
      controller?.signal.removeEventListener('abort', abortListener);
      xhr.abort();
      reject(new Error(ABORT_ERROR_NAME, { cause: ABORT_CAUSE_CODE }));
    };
    controller?.signal.addEventListener('abort', abortListener, { once: true });

    xhr.send(formData);
  });

export const isRequestAborted = (error: Error) =>
  error.message.includes(ABORT_ERROR_NAME);

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @param  {boolean} [withPreload] When set to true, request will be made without default headers, to match the preload request.
 *
 * @return {object}           The response data
 */
const request = (url: string, options: object = {}, withPreload = false) =>
  fetch(getRequest(url, options, withPreload))
    .then(checkStatus)
    .then(parse)
    .catch(onCatch);

export default request;
