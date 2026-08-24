import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register']

function joinRoutePath(parentPath, routePath) {
  if (!routePath || routePath === '/') {
    return parentPath || '/'
  }
  if (/^(https?:|mailto:|tel:)/.test(routePath)) {
    return undefined
  }
  if (routePath.startsWith('/')) {
    return routePath.replace(/\/{2,}/g, '/')
  }
  return `${parentPath === '/' ? '' : parentPath}/${routePath}`.replace(/\/{2,}/g, '/')
}

function findFirstAccessiblePath(routes, parentPath = '') {
  for (const route of routes || []) {
    if (!route || route.hidden || route.path === '*' || (route.meta && route.meta.openInNewWindow)) {
      continue
    }
    const routePath = joinRoutePath(parentPath, route.path)
    if (!routePath) {
      continue
    }
    const childPath = findFirstAccessiblePath(route.children, routePath)
    if (childPath) {
      return childPath
    }
    if (routePath !== '/' && routePath !== '/404' && routePath !== '/401') {
      return routePath
    }
  }
  return undefined
}

function isNotFoundRoute(target) {
  const resolved = router.resolve(target).route
  return resolved.path === '/404' || resolved.matched.some(record => record.path === '*')
}

router.beforeEach((to, from, next) => {
  NProgress.start()
  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      if (store.getters.roles.length === 0) {
        isRelogin.show = true
        // 判断当前用户是否已拉取完user_info信息
        store.dispatch('GetInfo').then(() => {
          isRelogin.show = false
          store.dispatch('GenerateRoutes').then(accessRoutes => {
            // 根据roles权限生成可访问的路由表
            router.addRoutes(accessRoutes) // 动态添加可访问路由表
            if (isNotFoundRoute(to.fullPath)) {
              next({ path: findFirstAccessiblePath(accessRoutes) || '/401', replace: true })
              return
            }
            next({ ...to, replace: true }) // hack方法 确保addRoutes已完成
          })
        }).catch(err => {
            store.dispatch('LogOut').then(() => {
              Message.error(err)
              next({ path: '/' })
            })
          })
      } else {
        next()
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`) // 否则全部重定向到登录页
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
