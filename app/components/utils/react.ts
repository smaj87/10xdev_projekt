/* eslint-disable import/no-unresolved */ // TODO: do weryfikacji
import {
  ChangeEvent as reactChangeEvent,
  Children as reactChildren,
  cloneElement as reactCloneElement,
  Component as ComponentReact,
  ComponentType as reactComponentType,
  createContext as createContextReact,
  createElement as createElementReact,
  createRef as createRefReact,
  DependencyList as reactDependencyList,
  EffectCallback as reactEffectCallback,
  ErrorInfo as ErrorInfoReact,
  FC as FCReact,
  FocusEvent as reactFocusEvent,
  forwardRef as forwardRefReact,
  Fragment as reactFragment,
  isValidElement as reactIsValidElement,
  KeyboardEvent as reactKeyboardEvent,
  lazy as lazyReact,
  memo as memoReact,
  MouseEvent as reactMouseEvent,
  MutableRefObject as reactMutableRefObject,
  PureComponent as PureComponentReact,
  ReactNode as reactReactNode,
  Ref as reactRef,
  RefObject as reactRefObject,
  Suspense as SuspenseReact,
  useCallback as useCallbackReact,
  useContext as useContextReact,
  useEffect as useEffectReact,
  useImperativeHandle as useImperativeHandleReact,
  useLayoutEffect as useLayoutEffectReact,
  useMemo as useMemoReact,
  useRef as useRefReact,
  useState as useStateReact,
} from 'react';
import { createPortal as createPortalReact } from 'react-dom';
import { createRoot as createRootReact } from 'react-dom/client';

export const useMemo = useMemoReact;
export const useCallback = useCallbackReact;
export const memo = memoReact;
export const useState = useStateReact;
export const useEffect = useEffectReact;

export const useEffectWithoutMount = (
  func: () => void,
  deps: any[] | undefined,
) => {
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) {
      return func();
    }

    return () => {};
  }, deps);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  return null;
};

export const useLayoutEffect = useLayoutEffectReact;
export const useContext = useContextReact;
export const useRef = useRefReact;
export const forwardRef = forwardRefReact;
export const useImperativeHandle = useImperativeHandleReact;
export const lazy = lazyReact;
export const Suspense = SuspenseReact;
export const createContext = createContextReact;
export const Children = reactChildren;
export const cloneElement = reactCloneElement;
export const isValidElement = reactIsValidElement;
export const PureComponent = PureComponentReact;
export const Component = ComponentReact;
export const createPortal = createPortalReact;
export const createElement = createElementReact;
export const createRoot = createRootReact;
export const Fragment = reactFragment;
export const createRef = createRefReact;

// Types
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type FC<P = {}> = FCReact<P>;
export type Ref<T> = reactRef<T>;
export type RefObject<T> = reactRefObject<T>;
export type MutableRefObject<T> = reactMutableRefObject<T>;
export type ReactNode = reactReactNode;
export type ChangeEvent<T = Element> = reactChangeEvent<T>;
export type KeyboardEvent<T = Element> = reactKeyboardEvent<T>;
export type ReactText = string | number;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ComponentType<P = {}> = reactComponentType<P>;
export type MouseEvent<T = Element> = reactMouseEvent<T>;
export type ErrorInfo = ErrorInfoReact;
export type FocusEvent<
  Target = Element,
  RelatedTarget = Element,
> = reactFocusEvent<Target, RelatedTarget>;
export type EffectCallback = reactEffectCallback;
export type DependencyList = reactDependencyList;
