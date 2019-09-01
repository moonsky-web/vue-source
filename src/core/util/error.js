/* @flow */

// 错误处理

import config from '../config';
import {warn} from './debug';
import {inBrowser, inWeex} from './env';
import {isPromise} from 'shared/util';
import {pushTarget, popTarget} from '../observer/dep';

/**
 * 默认错误处理
 * @param err
 * @param vm
 * @param info
 *
 * 下面请看API文档中的定义：
 错误传播规则

 默认情况下，如果全局的 config.errorHandler 被定义，所有的错误仍会发送它，因此这些错误仍然会向单一的分析服务的地方进行汇报。

 如果一个组件的继承或父级从属链路中存在多个 errorCaptured 钩子，则它们将会被相同的错误逐个唤起。

 如果此 errorCaptured 钩子自身抛出了一个错误，则这个新错误和原本被捕获的错误都会发送给全局的 config.errorHandler。

 一个 errorCaptured 钩子能够返回 false 以阻止错误继续向上传播。
 本质上是说“这个错误已经被搞定了且应该被忽略”。
 它会阻止其它任何会被这个错误唤起的 errorCaptured 钩子和全局的 config.errorHandler。
 */
export function handleError(err: Error, vm: any, info: string) {
  // 在处理错误处理程序时停用DEPS跟踪以避免可能的无限渲染
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  // 压栈
  pushTarget();
  try {
    if (vm) {
      let cur = vm;
      // 这个循环处理了错误会逐级向上传播
      while ((cur = cur.$parent)) {
        // 每个之间都可以自定义 errorCaptured 错误函数，并逐级向上“冒泡”
        const hooks = cur.$options.errorCaptured;
        if (hooks) {
          for (let i = 0; i < hooks.length; i++) {
            try {
              const capture = hooks[i].call(cur, err, vm, info) === false;
              // 这里如果是返回 false，则会阻止向上继续冒泡
              // 累死 jQuery 里，如果事件处理函数返回 false，
              // 则会取消默认事件和取消冒泡，并且会取消调用全局错误处理
              if (capture) return;
            } catch (e) {
              // 如果组件自定义错误函数继续报错，就只剩下全局错误处理了
              globalHandleError(e, cur, 'errorCaptured hook');
            }
          }
        }
      }
    }
    // 最终都会被全局错误处理方法处理，
    // 即通过 Vue.config.errorHandler 定义的错误处理函数
    // 没有定义的话，就使用默认打印错误消息
    globalHandleError(err, vm, info);
  } finally {
    // 出栈，保持继续追踪
    popTarget();
  }
}

/**
 * 使用错误处理
 * @param handler
 * @param context
 * @param args
 * @param vm
 * @param info
 * @returns {*}
 */
export function invokeWithErrorHandling(
  handler: Function,
  context: any,
  args: null | any[],
  vm: any,
  info: string,
) {
  let res;
  try {
    res = args ? handler.apply(context, args) : handler.call(context);
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch(e => handleError(e, vm, info + ` (Promise/async)`));
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true;
    }
  } catch (e) {
    handleError(e, vm, info);
  }
  return res;
}

/**
 * 可认为是最终级别的错误处理
 * @param err
 * @param vm
 * @param info
 * @returns {*}
 */
function globalHandleError(err, vm, info) {
  // 如果自定义了错误处理函数
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info);
    } catch (e) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      if (e !== err) {
        logError(e, null, 'config.errorHandler');
      }
    }
  }
  logError(err, vm, info);
}

/**
 * 生产环境会打印错误信息避免程序崩溃，开发环境直接抛出异常有助于及时发现错误
 * @param err
 * @param vm
 * @param info
 */
function logError(err, vm, info) {
  if (process.env.NODE_ENV !== 'production') {
    warn(`Error in ${info}: "${err.toString()}"`, vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err;
  }
}
