import { type Color, type ColorType } from "../Color";
import { type Vector2 } from "../Vector2";
import { type Shape } from "./Shape";

export const ROOT_ID = "root";
export const CAPTURE_NAME = "capture";
export const boxSize = 10;

export type ShapeColor = ColorType | `${ColorType}` | Color | `#${string}`;

export const CanvasCursorType = {
  Auto: "auto",
  Default: "default",
  None: "none",
  ContextMenu: "context-menu",
  Help: "help",
  Pointer: "pointer",
  Progress: "progress",
  Wait: "wait",
  Cell: "cell",
  Crosshair: "crosshair",
  Text: "text",
  VerticalText: "vertical-text",
  Alias: "alias",
  Copy: "copy",
  Move: "move",
  NoDrop: "no-drop",
  NotAllowed: "not-allowed",
  Grab: "grab",
  Grabbing: "grabbing",
  AllScroll: "all-scroll",
  ColResize: "col-resize",
  RowResize: "row-resize",
  NResize: "n-resize",
  EResize: "e-resize",
  SResize: "s-resize",
  WResize: "w-resize",
  NeResize: "ne-resize",
  NwResize: "nw-resize",
  SeResize: "se-resize",
  SwResize: "sw-resize",
  EwResize: "ew-resize",
  NsResize: "ns-resize",
  NeswResize: "nesw-resize",
  NwseResize: "nwse-resize",
  ZoomIn: "zoom-in",
  ZoomOut: "zoom-out",
} as const;

export type CanvasCursorType =
  (typeof CanvasCursorType)[keyof typeof CanvasCursorType];

export interface NodeUpdateOptions {
  zIndex: number;
}

export interface ShapeBehaviorOptions {
  /** 是否开启点击显示包围盒 */
  active?: boolean;
}

export type ShapeConstructorOptions = Partial<{
  /** x 坐标 */
  x: number;
  /** y 坐标 */
  y: number;
  /** 填充颜色 */
  fillColor?: ShapeColor;
  /** 描边颜色 */
  strokeColor?: ShapeColor;
  /** 线宽 */
  lineWidth?: number;
  /** 描边透明度 */
  strokeOpacity?: number;
  /** 填充透明度 */
  fillOpacity?: number;
  /** z-index */
  zIndex?: number;
  /** 父节点 */
  parent?: Shape | null;
  /** 缩放 */
  scale?: Vector2 | number;
  /** 旋转角度 */
  rotation?: number;
  /** 鼠标样式 */
  cursor?: CanvasCursorType;
}> &
  ShapeBehaviorOptions;

export interface IBoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
