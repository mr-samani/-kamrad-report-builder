export function cloneDeep<T>(value: T, stack = new WeakMap()): T {
  // Handle primitives
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Handle circular references
  if (stack.has(value as any)) {
    return stack.get(value as any);
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value) as any;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any;
  }

  // Handle Array
  if (Array.isArray(value)) {
    const arr: any[] = [];
    stack.set(value as any, arr);
    for (let i = 0; i < value.length; i++) {
      arr[i] = cloneDeep(value[i], stack);
    }
    return arr as any;
  }

  // Handle Map
  if (value instanceof Map) {
    const result = new Map();
    stack.set(value as any, result);
    value.forEach((val, key) => {
      result.set(cloneDeep(key, stack), cloneDeep(val, stack));
    });
    return result as any;
  }

  // Handle Set
  if (value instanceof Set) {
    const result = new Set();
    stack.set(value as any, result);
    value.forEach((val) => {
      result.add(cloneDeep(val, stack));
    });
    return result as any;
  }

  // Handle TypedArrays
  if (ArrayBuffer.isView(value)) {
    return new (value.constructor as any)(value) as any;
  }

  // Handle plain objects
  const clonedObj: Record<string | symbol, any> = {};
  stack.set(value as any, clonedObj);

  Reflect.ownKeys(value).forEach((key) => {
    clonedObj[key as any] = cloneDeep((value as any)[key], stack);
  });

  return clonedObj as T;
}
