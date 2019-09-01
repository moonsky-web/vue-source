import {initMixin} from './init';
import {stateMixin} from './state';
import {renderMixin} from './render';
import {eventsMixin} from './events';
import {lifecycleMixin} from './lifecycle';
import {warn} from '../util/index';

// 声明一个 Vue 函数，和 jQuery 一样，Vue 实际上也是在一个函数（类）上进行的封装
function Vue(options) {
  // 开发环境想会检测当前是否是通过 new 关键字创建的，生产环境不进行这一步检查
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

export default Vue;
