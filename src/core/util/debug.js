/* @flow */

import config from '../config';
import {noop} from 'shared/util';

// 调试信息：根据以下定义，生产环境下， vue 会屏蔽很多警告、提示等信息

// 警告：默认取消警告
export let warn = noop;
// 提示：默认取消任何提示
export let tip = noop;
// 生成组件追踪
export let generateComponentTrace = (noop: any); // work around flow check
// 格式化组件名
export let formatComponentName = (noop: any);

// 开发环境下重新定义上面几个值
if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined';
  // 匹配首字母和连接中划线下划线后的第一个字母
  const classifyRE = /(?:^|[-_])(\w)/g;
  // 这个函数是讲下划线或中划线字符串转化为驼峰形式，并且首字母大写
  // 注意与 'shared/util.js' 里的 camelize 的区别，后者不会首字母大写
  // 由于 class 是类的意思，可以理解为：类名化
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '');

  // 警告，
  // 很奇怪哈，警告用错误提示，信息用警告提示，
  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : '';

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace);
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`);
    }
  };

  // 提示
  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  // 格式化组件名
  // 看这几个方法可以推测，它们可能有好几个不同的地方调用
  formatComponentName = (vm, includeFile) => {
    if (vm.$root === vm) {
      return '<Root>';
    }
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm;
    let name = options.name || options._componentTag;
    const file = options.__file;
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    );
  };

  const repeat = (str, n) => {
    let res = '';
    while (n) {
      if (n % 2 === 1) res += str;
      if (n > 1) str += str;
      n >>= 1;// 移位操作
    }
    return res;
  };

  // 生成组件追踪
  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      // 要求不是根实例，根实例没有 $parent 值
      const tree = [];
      // 当前递归序列：名字取得好
      let currentRecursiveSequence = 0;
      while (vm) {
        if (tree.length > 0) {
          const last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue;
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map((vm, i) => `${
          i === 0 ? '---> ' : repeat(' ', 5 + i * 2)
          }${
          Array.isArray(vm)
            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
            : formatComponentName(vm)
          }`)
        .join('\n');
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`;
    }
  };
}
