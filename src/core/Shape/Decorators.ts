/** 重置状态 */
export function resetState(resetArgs: Record<string, any> = {}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const result = originalMethod.apply(this, args);
      Object.keys(resetArgs).forEach((key) => (this[key] = resetArgs[key]));
      return result;
    };
    return descriptor;
  };
}
