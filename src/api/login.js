import request from '@/utils/request'

const REGISTER_DEVICE_ID_KEY = 'ems-register-device-id'

function registerDeviceId() {
  let deviceId = localStorage.getItem(REGISTER_DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
    localStorage.setItem(REGISTER_DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

// 登录方法
export function login(username, password, code, uuid) {
  return request({
    url: '/auth/login',
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    // 登录页自行展示错误，跳过全局 Message
    skipErrorMessage: true,
    method: 'post',
    data: { username, password, code, uuid }
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取安装商自助注册状态
export function getRegisterStatus() {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'get'
  })
}

// 发送注册邮箱验证码
export function sendRegisterEmailCode(email) {
  return request({
    url: '/auth/register/email-code',
    headers: {
      isToken: false,
      'X-Device-Id': registerDeviceId()
    },
    method: 'post',
    data: { email }
  })
}

// 刷新方法
export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'delete'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/code',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}
