import { BubbleEventType, CAPTURE_NAME, CaptureEventType, CaptureFocusEventType } from "./types";
import {
  CVEvent,
  CVFocusEvent,
  CVMouseEvent,
  EventHandler,
  EventListenerType,
  EventsType,
  EventWithStop,
  FocusEventType,
} from "./types";

export let isOpenMouseMoveEvent = false;

// 由于鼠标移动事件触发次数过高，可能会有性能问题
export function setIsOpenMouseMoveEvent(isOpen: boolean) {
  isOpenMouseMoveEvent = isOpen;
}

export class Events<This = any> {
  private readonly _eventMap: Map<EventsType, EventHandler<any, This>[]> =
    new Map();
  private _isPropagationStopped = false;

  /** 添加事件 */
  private _addEvent(eventname: EventsType, handler: EventHandler<any, This>) {
    if (this._eventMap.has(eventname)) {
      this._eventMap.get(eventname)!.push(handler);
    } else {
      this._eventMap.set(eventname, [handler]);
    }
  }

  /** 移除事件 */
  private _removeEvent(
    eventname: EventsType,
    handler: EventHandler<any, This>
  ) {
    const handlers = this._eventMap.get(eventname);
    if (handlers) {
      handlers.splice(handlers.indexOf(handler), 1);
    }
  }

  public addEventListener(
    eventname: `${BubbleEventType}`,
    handler: EventHandler<CVMouseEvent, This>,
    isCapture?: boolean
  ): void;
  public addEventListener(
    eventname: `${FocusEventType}`,
    handler: EventHandler<CVFocusEvent, This>,
    isCapture?: boolean
  ): void;
  public addEventListener(
    eventname: EventListenerType,
    handler: EventHandler<any, This>,
    isCapture = false
  ) {
    let prefix = isCapture ? CAPTURE_NAME : "";
    this._addEvent(`${prefix}${eventname}` as EventsType, handler);
  }

  public removeEventListener(
    eventname: `${BubbleEventType}`,
    handler: EventHandler<CVMouseEvent, This>,
    isCapture?: boolean
  ): void;
  public removeEventListener(
    eventname: `${FocusEventType}`,
    handler: EventHandler<CVFocusEvent, This>,
    isCapture?: boolean
  ): void;
  public removeEventListener(
    eventname: EventListenerType,
    handler: EventHandler<any, This>,
    isCapture = false
  ) {
    let prefix = isCapture ? CAPTURE_NAME : "";
    this._removeEvent(`${prefix}${eventname}` as EventsType, handler);
  }

  // 事件冒泡

  /** 点击事件 */
  set onClick(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(BubbleEventType.onClick, _handler);
  }

  /** 鼠标进入事件 */
  set onMouseenter(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(BubbleEventType.onMouseEnter, _handler);
  }

  /** 鼠标离开事件 */
  set onMouseleave(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(BubbleEventType.onMouseLeave, _handler);
  }

  /** 鼠标移动事件 */
  set onMousemove(_handler: EventHandler<CVMouseEvent, This>) {
    setIsOpenMouseMoveEvent(true);
    this._addEvent(BubbleEventType.onMouseMove, _handler);
  }

  /** 鼠标按下事件 */
  set onMousedown(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(BubbleEventType.onMouseDown, _handler);
  }

  /** 鼠标抬起事件 */
  set onMouseup(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(BubbleEventType.onMouseUp, _handler);
  }

  /** 失去焦点事件 */
  set onBlur(_handler: EventHandler<CVFocusEvent<This>, This>) {
    this._addEvent(FocusEventType.onBlur, _handler);
  }

  /** 获得焦点事件 */
  set onFocus(_handler: EventHandler<CVFocusEvent<This>, This>) {
    this._addEvent(FocusEventType.onFocus, _handler);
  }

  // 事件捕获

  /** 捕获点击事件 */
  set onCaptureClick(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(CaptureEventType.onClick, _handler);
  }

  /** 捕获鼠标进入事件 */
  set onCaptureMouseenter(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(CaptureEventType.onMouseEnter, _handler);
  }

  /** 捕获鼠标离开事件 */
  set onCaptureMouseleave(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(CaptureEventType.onMouseLeave, _handler);
  }

  /** 捕获鼠标移动事件 */
  set onCaptureMousemove(_handler: EventHandler<CVMouseEvent, This>) {
    setIsOpenMouseMoveEvent(true);
    this._addEvent(CaptureEventType.onMouseMove, _handler);
  }

  /** 捕获鼠标按下事件 */
  set onCaptureMousedown(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(CaptureEventType.onMouseDown, _handler);
  }

  /** 捕获鼠标抬起事件 */
  set onCaptureMouseup(_handler: EventHandler<CVMouseEvent, This>) {
    this._addEvent(CaptureEventType.onMouseUp, _handler);
  }

  /** 捕获失焦事件 */
  set onCaptureBlur(_handler: EventHandler<CVFocusEvent<This>, This>) {
    this._addEvent(CaptureFocusEventType.onBlur, _handler);
  }

  /** 捕获获得焦点事件 */
  set onCaptureFocus(_handler: EventHandler<CVFocusEvent<This>, This>) {
    this._addEvent(CaptureFocusEventType.onFocus, _handler);
  }

  /** 手动触发事件 */
  triggerEvent = (
    eventname: EventsType,
    event: CVEvent,
    target: This = this as any
  ) => {
    const handlers = this._eventMap.get(eventname);

    if (!handlers) return false;

    this._isPropagationStopped = false;
    const eventWithStop: EventWithStop<CVEvent> = {
      target: event,
      stopPropagation: () => (this._isPropagationStopped = true),
    };

    handlers.forEach((handler) => handler(eventWithStop, target));
    return this._isPropagationStopped;
  };

  /** 事件 map */
  get eventMap(): Map<EventsType, EventHandler<CVEvent, This>[]> {
    return new Map(this._eventMap);
  }
}
