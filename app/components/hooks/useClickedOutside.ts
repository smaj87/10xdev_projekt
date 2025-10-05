import { RefObject, useCallback, useEffect } from 'components/utils/react';

/**
 * Calls **callback** when user didn't click any element listed in **refs**.
 */
const useClickedOutside = (
  refs: RefObject<HTMLElement>[],
  callback: () => void,
) => {
  const onDocumentClick = useCallback(
    (e) => {
      const isClickedOutside = refs.every(
        (el) => !el?.current?.contains(e.target) || false,
      );

      if (isClickedOutside) {
        callback();
      }
    },
    [callback],
  );

  useEffect(() => {
    window.addEventListener('mouseup', onDocumentClick, true);

    return () => {
      window.removeEventListener('mouseup', onDocumentClick, true);
    };
  }, []);
};

export default useClickedOutside;
