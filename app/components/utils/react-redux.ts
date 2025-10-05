// eslint-disable-next-line import/no-relative-packages
import { RootState } from 'initRedux';
import { ThunkAction, ThunkDispatch as thunkThunkDispatch } from 'redux-thunk';

import { useEffect, useMemo, useRef, useState } from 'components/utils/react';
import { Action } from 'components/utils/redux';
import { getState } from 'components/utils/store';
import subscribeManager from 'components/utils/SubscribeManager';

interface ComponentRef<S, P> {
  current: {
    selector: S;
    params?: P;
    value: unknown;
    onChange: () => void;
  };
}

type UseSelector = <
  SelectorType extends (
    state: any,
    params: Parameters<SelectorType>[1], // Get second argument of the selector
  ) => ReturnType<SelectorType>,
>(
  selector: SelectorType,
  params?: Parameters<SelectorType>[1],
) => ReturnType<SelectorType>;

// useSelector with extra params
// TODO: Return type in useSelector(getFieldSendData, { field: 'id' }) is not working correctly
export const useSelector: UseSelector = (selector, params?) => {
  const unmountedRef = useRef(false);
  // @ts-ignore todo
  const componentRef: ComponentRef<S, P> = useRef({
    onChange: () => {
      const newValue = getStateValueBySelector(
        componentRef.current.selector,
        // @ts-ignore todo
        componentRef.current.params,
      );

      if (componentRef.current.value !== newValue) {
        componentRef.current.value = newValue;
        if (!unmountedRef.current) {
          setRefresh([]);
        }
      }
    },
  });

  const [, setRefresh] = useState([]);

  useMemo(() => {
    componentRef.current.selector = selector;
    componentRef.current.params = params;
    // @ts-ignore todo
    componentRef.current.value = getStateValueBySelector(selector, params);
  }, [selector, params]);

  useEffect(() => {
    const unsubscribe = subscribeManager.subscribe(
      componentRef.current.onChange,
    );

    componentRef.current.onChange();
    // todo useLayoutEffect powodowal problemy w webmail 2.0, nie powwoduje za to w wersjach 3.
    // todo chyba sa jakies problemy z komponentami klasowymi. Po zejsciu z webmiala 2.0 zmienic na LayoutEffect i wywalic line 59

    return () => {
      unsubscribe();
      unmountedRef.current = true;
    };
  }, []);

  return componentRef.current.value as ReturnType<UseSelector>;
};

// works like useSelector but without component update
export const getStateValueBySelector: UseSelector = (
  selector,
  params?,
): ReturnType<UseSelector> => selector(getState(), params);

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;

export type ThunkDispatch<
  State,
  ExtraThunkArg,
  BasicAction extends Action,
> = thunkThunkDispatch<State, ExtraThunkArg, BasicAction>;
