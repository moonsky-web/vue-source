/* @flow */

import {identity, no, noop} from 'shared/util';

import {LIFECYCLE_HOOKS} from 'shared/constants';
// 属性 Vue 文档 API 的应该知道，这些是 Vue 的基本配置信息
//
export type Config = {
  /**
   * user
   */
  // 自定义合并策略
  optionMergeStrategies: { [key: string]: Function };
  // 忽略警告
  silent: boolean;
  // 生产环境提示
  productionTip: boolean;
  // 性能
  performance: boolean;
  devtools: boolean;
  // 错误处理
  errorHandler: ?(err: Error, vm: Component, info: string) => void;
  // 警告处理
  warnHandler: ?(msg: string, vm: Component, trace: string) => void;
  // 忽略元素 ['customTag']
  ignoredElements: Array<string | RegExp>;
  // 按键码映射 {enter: 13, esc:27}
  keyCodes: { [key: string]: number | Array<number> };

  /**
   * platform
   * @param x
   */
  isReservedTag: (x?: string) => boolean;
  isReservedAttr: (x?: string) => boolean;
  parsePlatformTagName: (x: string) => string;
  isUnknownElement: (x?: string) => boolean;
  getTagNamespace: (x?: string) => string | void;
  mustUseProp: (tag: string, type: ?string, name: string) => boolean;

  /**
   * private
   */
  async: boolean;

  /**
   * legacy
   */
  _lifecycleHooks: Array<string>;
};

export default ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: process.env.NODE_ENV !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS,
}: Config);
