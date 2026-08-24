import FRONTEND_MAP_CONFIG from '@/config/map'
import {
  buildMarkerIcon as buildAmapMarkerIcon,
  isValidCoordinate,
  loadAmapScript
} from '@/utils/amap'
import { buildMarkerIcon as buildTencentMarkerIcon, loadTencentMapScript } from '@/utils/qqMap'

export { isValidCoordinate }

export function resolveMapProvider(mapConfig) {
  const backend = mapConfig || {}
  const front = FRONTEND_MAP_CONFIG || {}
  const provider = String(front.provider || backend.provider || backend.type || '').toLowerCase()
  const forceAmap = provider === 'amap' || provider === 'gaode' || provider === '高德'

  // 高德 Key：只用前端配置 / 后端 amap 专用字段，避免误用腾讯 key
  const amapKey = front.amapKey || backend.amapKey || backend.gaodeKey || ''
  const securityJsCode = front.amapSecurityJsCode || backend.amapSecurityJsCode || backend.securityJsCode || backend.gaodeSecurityJsCode || ''

  if (forceAmap) {
    return {
      provider: 'amap',
      key: amapKey,
      securityJsCode
    }
  }

  if (amapKey) {
    return {
      provider: 'amap',
      key: amapKey,
      securityJsCode
    }
  }

  if (backend.key) {
    return {
      provider: 'tencent',
      key: backend.key,
      securityJsCode: ''
    }
  }

  return {
    provider: '',
    key: '',
    securityJsCode: ''
  }
}

export function loadMapScript(providerInfo) {
  if (!providerInfo || !providerInfo.key) {
    return Promise.reject(new Error('高德地图 Key 缺失，请在 src/config/map.js 填写 amapKey'))
  }
  if (providerInfo.provider === 'amap') {
    return loadAmapScript(providerInfo.key, providerInfo.securityJsCode)
  }
  return loadTencentMapScript(providerInfo.key)
}

export function buildMarkerIcon(color, label) {
  return buildAmapMarkerIcon(color, label) || buildTencentMarkerIcon(color, label)
}
