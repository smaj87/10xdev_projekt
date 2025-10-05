import usePreviousValue from 'components/hooks/usePreviousValue';
import history from 'components/utils/history';
import { useEffect, useRef } from 'components/utils/react';

const useBlockHistory = (isOpen: boolean) => {
  const unblock = useRef<VoidFunction>();
  const prevIsOpen = usePreviousValue(isOpen);

  useEffect(() => {
    if (!prevIsOpen && isOpen) {
      unblock.current = history.block(() => false);
    } else if (prevIsOpen && !isOpen) {
      unblock.current?.();
    }

    return () => {
      unblock.current?.();
    };
  }, [prevIsOpen, isOpen]);
};

export default useBlockHistory;
