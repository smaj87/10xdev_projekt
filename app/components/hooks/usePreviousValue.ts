import { useEffect, useRef } from 'components/utils/react';

const usePreviousValue = <T>(value: T) => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

export default usePreviousValue;
