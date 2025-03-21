import { Shape } from "@/core/Shape/Shape";

export const CAPTURE_NAME = "capture";

export enum BubbleEventType {
  onClick = "click",
  onMouseEnter = "mouseenter",
  onMouseLeave = "mouseleave",
  onMouseMove = "mousemove",
  onMouseDown = "mousedown",
  onMouseUp = "mouseup",
}

export enum CaptureEventType {
  onClick = `captureclick`,
  onMouseEnter = "capturemouseenter",
  onMouseLeave = "capturemouseleave",
  onMouseMove = "capturemousemove",
  onMouseDown = "capturemousedown",
  onMouseUp = "capturemouseup",
}

export enum FocusEventType {
  onFocus = "focus",
  onBlur = "blur",
}

export enum CaptureFocusEventType {
  onFocus = `capturefocus`,
  onBlur = `captureblur`,
}

export type OriginEventHandler<T = Shape> = (
  target: T,
  event: MouseEvent
) => any;
export type EventsType =
  | BubbleEventType
  | CaptureEventType
  | FocusEventType
  | CaptureFocusEventType;
export type EventListenerType =
  | `${BubbleEventType}`
  | `${FocusEventType}`;

// 事件定义
export type CVMouseEvent = MouseEvent;
export type CVFocusEvent<T = Shape> = { shape: T };

export type CVEvent = CVMouseEvent | CVFocusEvent;

export interface EventWithStop<T> {
  target: T;
  stopPropagation: () => void;
}

// 修改 EventHandler 类型定义
export type EventHandler<Event, T = Shape> = (
  event: EventWithStop<Event>,
  target: T
) => void;

export const WindowsEventKeys = {
  Backspace: "Backspace",
  Delete: "Delete",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  Escape: "Escape",
  // TODO: Add more keys
} as const;
