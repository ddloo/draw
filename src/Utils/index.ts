/** 获取 Set 集合中最后一个元素 */
export function getLastSetValue<T>(set: Set<T> | undefined): T | undefined {
  if (!set) return;

  return [...set][set.size - 1];
}

/** 定时器 */
export function interval(callback: () => any, delay: number) {
  const timer: { id: NodeJS.Timeout } = {} as any;

  function performWork() {
    return setTimeout(() => {
      callback();
      const newTimer = performWork();
      timer.id = newTimer;
    }, delay);
  }

  performWork();

  return timer;
}

/** 取消定时器 */
export function clearInterval(timer: NodeJS.Timeout) {
  clearTimeout(timer);
}

/** 防抖 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 16
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
