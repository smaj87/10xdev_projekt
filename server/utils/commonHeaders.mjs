/**
 * Common header configurations for static assets
 */
export const getHeadersForAsset = (request) => {
  const headers = {};
  const { url } = request;

  if (url.endsWith('.woff') || url.endsWith('.woff2')) {
    headers['Cache-Control'] = 'max-age=604800, public';
    headers['Content-Type'] = url.endsWith('.woff2')
      ? 'font/woff2'
      : 'font/woff';
  } else if (url.endsWith('.js.gz')) {
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Type'] = 'application/javascript';
  }

  return headers;
};
