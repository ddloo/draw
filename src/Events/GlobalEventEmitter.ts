type Listener = (...args: any[]) => void;
type EventMap = Record<string, Listener[]>;

class EventEmitter {
  private events: EventMap = {};
  private maxListeners: number = 10;

  setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  on(eventName: string, listener: Listener): void {
    this.addListener(eventName, listener, false);
  }

  once(eventName: string, listener: Listener): void {
    this.addListener(eventName, listener, true);
  }

  private addListener(
    eventName: string,
    listener: Listener,
    isOnce: boolean
  ): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    if (this.events[eventName].length >= this.maxListeners) {
      console.warn(`警告: Event "${eventName}" 已达到最大监听器数量。`);
    }

    const wrappedListener: Listener = (...args: any[]) => {
      listener(...args);
      if (isOnce) {
        this.off(eventName, wrappedListener);
      }
    };

    this.events[eventName].push(wrappedListener);
  }

  emit(eventName: string, ...args: any[]): void {
    const listeners = this.events[eventName];
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error: any) {
          this.handleError(error);
        }
      });
    }

    if (eventName !== "error" && args[0] instanceof Error) {
      this.handleError(args[0]);
    }
  }

  off(eventName: string, listenerToRemove: Listener): void {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        (listener) => listener !== listenerToRemove
      );
    }
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }

  listenerCount(eventName: string): number {
    return this.events[eventName]?.length || 0;
  }

  listeners(eventName: string): Listener[] {
    return this.events[eventName] ? [...this.events[eventName]] : [];
  }

  private handleError(error: Error): void {
    if (this.events["error"] && this.events["error"].length > 0) {
      this.emit("error", error);
    } else {
      console.error("未处理的错误:", error);
      throw error;
    }
  }
}

export const emitter = new EventEmitter();
