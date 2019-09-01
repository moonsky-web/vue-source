// 源码中是没有分号结尾的，个人习惯，总是以分号结尾

// 首先引入基本实例
import Vue from './instance/index';
// 想这类一般是是工具，这类文件夹的性质也有较强的工具性质
// 理解这些有助于在实际项目中合理拆解自己的文件
import {initGlobalAPI} from './global-api/index';
import {isServerRendering} from 'core/util/env';
import {FunctionalRenderContext} from 'core/vdom/create-functional-component';

// 初始化全局API，点击进入这个方法
initGlobalAPI(Vue);

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering,
});

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext;
  },
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext,
});

Vue.version = '__VERSION__';

export default Vue;
