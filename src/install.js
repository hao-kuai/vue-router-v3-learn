import View from './components/view'
import Link from './components/link'

export let _Vue
/*
* Vue.js 的插件应该暴露一个 install 方法。
* 这个方法的第一个参数是 Vue 构造器，第二个参数是一个可选的选项对象
* */
export function install (Vue) {
  // 防止重复初始化
  if (install.installed && _Vue === Vue) return

  // 标记已挂载并缓存 Vue 对象
  install.installed = true
  _Vue = Vue

  // 判断是否未定义
  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  // 全局混入：利用混入钩子优先执行原理
  // 同名钩子函数将合并为一个数组，因此都将被调用。
  // 另外，混入对象的钩子将在组件自身钩子之前调用。
  Vue.mixin({
    beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 如果$parent存在，则返回$parent._routerRoot；否则返回自身
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

  // Vue 原型挂载 $router 属性，只读
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })
  // Vue 原型挂载 $route 属性，只读
  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  // 注册组件
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
