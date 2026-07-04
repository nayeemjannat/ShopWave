import { useEffect, useRef } from 'react';

export const useAbortController = () => {
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const getSignal = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  };

  return getSignal;
};

export default useAbortController;
