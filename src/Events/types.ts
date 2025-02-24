import { Shape } from "@/core/Shape/Shape";

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

export type OriginEventHandler<T = Shape> = (target: T, event: MouseEvent) => any;
export type EventsType = BubbleEventType | CaptureEventType;
export interface EventWithStop {
  target: MouseEvent;
  stopPropagation: () => void;
}

// 修改 EventHandler 类型定义
export type EventHandler<T = Shape> = (event: EventWithStop, target: T) => void;

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
