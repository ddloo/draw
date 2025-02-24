import { BubbleEventType, CaptureEventType } from "./types";
import type { EventHandler, EventsType, EventWithStop } from "./types";

export let isOpenMouseMoveEvent = false;

// 由于鼠标移动事件触发次数过高，可能会有性能问题
export function setIsOpenMouseMoveEvent(isOpen: boolean) {
  isOpenMouseMoveEvent = isOpen;
}

export class Events<This = any> {
  private readonly _eventMap: Map<EventsType, EventHandler<This>[]> = new Map();
  private _isPropagationStopped = false;

  /** 添加事件 */
  addEvent(eventname: EventsType, handler: EventHandler<This>) {
    if (this._eventMap.has(eventname)) {
      this._eventMap.get(eventname)!.push(handler);
    } else {
      this._eventMap.set(eventname, [handler]);
    }
  }

  /** 移除事件 */
  removeEvent(eventname: EventsType, handler: EventHandler<This>) {
    const handlers = this._eventMap.get(eventname);
    if (handlers) {
      handlers.splice(
        handlers.indexOf(handler),
        1
      );
    }
  }

  // 事件冒泡

  /** 点击事件 */
  set onClick(_handler: EventHandler<This>) {
    this.addEvent(BubbleEventType.onClick, _handler);
  }

  /** 鼠标进入事件 */
  set onMouseenter(_handler: EventHandler<This>) {
    this.addEvent(BubbleEventType.onMouseEnter, _handler);
  }

  /** 鼠标离开事件 */
  set onMouseleave(_handler: EventHandler<This>) {
    this.addEvent(BubbleEventType.onMouseLeave, _handler);
  }

  /** 鼠标移动事件 */
  set onMousemove(_handler: EventHandler<This>) {
    setIsOpenMouseMoveEvent(true);
    this.addEvent(BubbleEventType.onMouseMove, _handler);
  }

  /** 鼠标按下事件 */
  set onMousedown(_handler: EventHandler<This>) {
    this.addEvent(BubbleEventType.onMouseDown, _handler);
  }

  /** 鼠标抬起事件 */
  set onMouseup(_handler: EventHandler<This>) {
    this.addEvent(BubbleEventType.onMouseUp, _handler);
  }

  // 事件捕获

  /** 捕获点击事件 */
  set onCaptureClick(_handler: EventHandler<This>) {
    this.addEvent(CaptureEventType.onClick, _handler);
  }

  /** 捕获鼠标进入事件 */
  set onCaptureMouseenter(_handler: EventHandler<This>) {
    this.addEvent(CaptureEventType.onMouseEnter, _handler);
  }

  /** 捕获鼠标离开事件 */
  set onCaptureMouseleave(_handler: EventHandler<This>) {
    this.addEvent(CaptureEventType.onMouseLeave, _handler);
  }

  /** 捕获鼠标移动事件 */
  set onCaptureMousemove(_handler: EventHandler<This>) {
    setIsOpenMouseMoveEvent(true);
    this.addEvent(CaptureEventType.onMouseMove, _handler); 
  }

  /** 捕获鼠标按下事件 */
  set onCaptureMousedown(_handler: EventHandler<This>) {
    this.addEvent(CaptureEventType.onMouseDown, _handler);
  }

  /** 捕获鼠标抬起事件 */
  set onCaptureMouseup(_handler: EventHandler<This>) {
    this.addEvent(CaptureEventType.onMouseUp, _handler);
  }

  /** 手动触发事件 */
  triggerEvent = (eventname: EventsType, event: MouseEvent, target: This = this as any) => {
    const handlers = this._eventMap.get(eventname);
    
    if(!handlers) return false;

    this._isPropagationStopped = false;
    const eventWithStop: EventWithStop = {
      target: event,
      stopPropagation: () => this._isPropagationStopped = true
    }

    handlers.forEach((handler) => handler(eventWithStop, target));
    return this._isPropagationStopped;
  }

  /** 事件 map */
  get eventMap(): Map<EventsType, EventHandler<This>[]> {
    return new Map(this._eventMap);
  }
}