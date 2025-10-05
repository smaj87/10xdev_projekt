import {
  CSSProperties as preactCSSProperties,
  TargetedEvent as preactTargetedEvent,
} from 'preact/compat';

export type TargetedEvent<
  Target extends EventTarget = EventTarget,
  TypedEvent extends Event = Event,
> = preactTargetedEvent<Target, TypedEvent>;

export type CSSProperties = preactCSSProperties;
