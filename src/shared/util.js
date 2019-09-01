/* @flow */

// 只读空对象，一般用于设置解构表达式中默认值，
// 这样可以避免一些非空判断，同时又不用创建新的对象，节省资源
export const emptyObject = Object.freeze({});

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
// 一些断言函数
export function isUndef(v: any): boolean %checks {
  return v === undefined || v === null;
}

export function isDef(v: any): boolean %checks {
  return v !== undefined && v !== null;
}

export function isTrue(v: any): boolean %checks {
  return v === true;
}

export function isFalse(v: any): boolean %checks {
  return v === false;
}

/**
 * Check if value is primitive.
 * 是否是基础数据
 */
export function isPrimitive(value: any): boolean %checks {
  return (
    // 只有原始数据的 typeof 出来才会是这些值，通过 new String(...)、new Number(...) 等都是 object
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  );
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 *
 * 非 null Object
 */
export function isObject(obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object';
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 *
 * 这个可以认为是 typeof 的扩展，能更加准确，
 */
const _toString = Object.prototype.toString;

export function toRawType(value: any): string {
  return _toString.call(value).slice(8, -1);
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
export function isPlainObject(obj: any): boolean {
  return _toString.call(obj) === '[object Object]';
}

export function isRegExp(v: any): boolean {
  return _toString.call(v) === '[object RegExp]';
}

/**
 * Check if val is a valid array index.
 *
 * 是一个有效的数组索引：大于 0、是一个整数、不是无限大的数字
 */
export function isValidArrayIndex(val: any): boolean {
  const n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n
    // isFinite 会先将 val 转换为一个数字后再判断
    // 而 Number.isFinite 不会转换
    // 所以 isFinite('1') === true
    // 所以 Number.isFinite('1') === false
    && isFinite(val);
}

export function isPromise(val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  );
}

/**
 * Convert a value to a string that is actually rendered.
 * 为空的话，直接返回空字符串
 *
 * 是一个对象就通关 JSON 序列化转化成字符串，否则通过 String 函数返回
 *
 * undefined == null
 * 0 == []
 * 0 == ''
 * '' == []
 * 1 == true
 * 0 == false
 * 2 != true
 * '' == false
 * [] == false --> 故在判断数组是非空时不用判断长度 if(arr && arr.length){}，只需 if(arr){} 即可
 */
export function toString(val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val);
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 */
export function toNumber(val: string): number | string {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 *
 * 返回一个“定义器” 查看某个键是否定义过
 *
 * const map = makeMap('123,456,zbc') ==> {123:true, 456: true, abc: true}
 * 然后可以 map[123] ==> true、map[789] ==> undefined
 *
 * 用于判断
 */
export function makeMap(
  str: string,
  // 是否全是大小写
  expectsLowerCase?: boolean,
): (key: string) => true | void {
  // 创建一个足够干净的 object；
  // 可通过 Chrome 查看三者 '__proto__' 的区别
  // Object.create({})
  // Object.create(null)
  // Object.create(Object.create(null))
  const map = Object.create(null);
  const list: Array<string> = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val];
}

/**
 * Check if a tag is a built-in tag.
 * 是否是内置组件标签
 */
export const isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if an attribute is a reserved attribute.
 * 是否是保留字
 * JavaScript 有关键字、保留字
 * Vue 为了更好的运行，也定义了一些保留字
 */
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array.
 */
export function remove(arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

/**
 * Check whether an object has the property.
 *
 * 这个 key 是自己定义的而不是从原型链上继承的
 *
 * 这里注意【MDN】：
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/in
 *
 * 经过 chrome76 测试，与 MDN 上描述不一致，in 运算符得到的结果基本与 hasOwn 一致，具体差异未定
 * 但是 in 的右操作数必须是一个对象或对象引用，不能是字符串、数字等直接量
 */
const hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasOwn(obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key);
}

/**
 * Create a cached version of a pure function.
 *
 * 简单缓存
 *
 * const cache = cached(val => val + '12');
 * cache[12] == '1212'
 *
 * 每次计算的结果会被缓存，如用在 computed 属性上
 */
export function cached<F: Function>(fn: F): F {
  const cache = Object.create(null);
  return (function cachedFn(str: string) {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }: any);
}

/**
 * Camelize a hyphen-delimited string.
 *
 * 字符串驼峰话，主要用于 自定义属性，如：
 * camelize('before-create') ==> beforeCreate
 */
const camelizeRE = /-(\w)/g;
export const camelize = cached((str: string): string => {
  // str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
  // 下划线是在函数调用中的特殊写法，代表忽略这个参数
  // String.replace( str|reg, otherStr|Function)
  //
  // replace 函数接受的参数：
  // - first: 完全匹配的字符串
  // - ...符合匹配的子串（分组串）
  // - end: 符合当前匹配出现的位置索引
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '');
});

/**
 * Capitalize a string.
 *  首字母大写
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

/**
 * Hyphenate a camelCase string.
 *
 * 驼峰转为中划线
 *
 * 注意正则表达式中的 \B：非单词边界
 */
const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = cached((str: string): string => {
  // str.replace(/\B([A-Z])/g, '-$1').toLowerCase();
  return str.replace(hyphenateRE, '-$1').toLowerCase();
});

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 *
 * 一个简单的 Function.prototype.bind 实现，未完全实现 bind 功能
 *
 * 完整实现
 *
 * Function.prototype.bind0 = function(thisValue, ...args){
 *   const self = this;
 *   if(this.length >= args.length){
 *     return (...params) => self.apply(thisValue, args.concat(params));
 *   } else {
 *     // 这里用了缓存数值，可根据情况，不用缓存
 *     const value = self.apply(thisValue, args);
 *     return _ => value;
 *   }
 * }
 */

/* istanbul ignore next */
function polyfillBind(fn: Function, ctx: Object): Function {
  function boundFn(a) {
    const l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx);
  }

  boundFn._length = fn.length;
  return boundFn;
}

/**
 * JS 原生实现的 bind
 * @param fn
 * @param ctx
 * @returns {*}
 */
function nativeBind(fn: Function, ctx: Object): Function {
  return fn.bind(ctx);
}

export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind;

/**
 * Convert an Array-like object to a real Array.
 *
 * 将一个类数组转为数组
 * 类数组：NodeList Arguments、jQuery 对象等
 */
export function toArray(list: any, start?: number): Array<any> {
  start = start || 0;
  let i = list.length - start;
  const ret: Array<any> = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret;
}

/**
 * Mix properties into target object.
 *
 * 浅拷贝
 */
export function extend(to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key];
  }
  return to;
}

/**
 * Merge an Array of Objects into a single Object.
 *
 * 将一个数组的所有对象平铺化到一个对象上
 */
export function toObject(arr: Array<any>): Object {
  const res = {};
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res;
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 *
 * 无操作：无操作为什么要声明三个参数？
 */
export function noop(a?: any, b?: any, c?: any) {
}

/**
 * Always return false.
 *
 * 无操作为什么要声明三个参数？
 */
export const no = (a?: any, b?: any, c?: any) => false;

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
export const identity = (_: any) => _;

/**
 * Generate a string containing static keys from compiler modules.
 */
export function genStaticKeys(modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || []);
  }, []).join(',');
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 *
 * 深度比较相等
 */
export function looseEqual(a: any, b: any): boolean {
  if (a === b) return true;
  const isObjectA = isObject(a);
  const isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    // 如果都是对象
    try {
      const isArrayA = Array.isArray(a);
      const isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        // 如果都是数组，要求数组的每一项都相等
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i]);
        });
      } else if (a instanceof Date && b instanceof Date) {
        // 如果都是 Date
        return a.getTime() === b.getTime();
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key]);
        });
      } else {
        /* istanbul ignore next */
        return false;
      }
    } catch (e) {
      /* istanbul ignore next */
      return false;
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b);
  } else {
    return false;
  }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 *
 * 返回数组中第一个深度等于期望值的索引或 -1
 */
export function looseIndexOf(arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i;
  }
  return -1;
}

/**
 * Ensure a function is called only once.
 *
 * 确保一个函数只会被调用一次
 */
export function once(fn: Function): Function {
  let called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  };
}
