let amapScriptPromise = null

export function loadAmapScript(key, securityJsCode) {
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (amapScriptPromise) {
    return amapScriptPromise
  }
  if (securityJsCode) {
    window._AMapSecurityConfig = {
      securityJsCode: String(securityJsCode)
    }
  }
  // 有安全密钥用 2.0；否则用 1.4.15
  const version = securityJsCode ? '2.0' : '1.4.15'
  amapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=${version}&key=${encodeURIComponent(key)}&callback=__emsAmapReady`
    script.onerror = error => {
      amapScriptPromise = null
      reject(error)
    }
    window.__emsAmapReady = () => {
      delete window.__emsAmapReady
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        amapScriptPromise = null
        reject(new Error('AMap 加载失败'))
      }
    }
    document.head.appendChild(script)
  })
  return amapScriptPromise
}

export function resolveAmapConfig(mapConfig) {
  const config = mapConfig || {}
  return {
    key: config.amapKey || config.gaodeKey || config.key || '',
    securityJsCode: config.amapSecurityJsCode || config.securityJsCode || config.gaodeSecurityJsCode || ''
  }
}

export function isValidCoordinate(longitude, latitude) {
  const lng = Number(longitude)
  const lat = Number(latitude)
  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return false
  }
  if (lng === 0 && lat === 0) {
    return false
  }
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

export function buildMarkerIcon(color, label) {
  const text = label || ''
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
      <path d="M24 2C12.402 2 3 11.178 3 22.5C3 39 24 54 24 54S45 39 45 22.5C45 11.178 35.598 2 24 2Z" fill="${color}"/>
      <circle cx="24" cy="22" r="10" fill="#ffffff"/>
      <text x="24" y="26" text-anchor="middle" font-size="12" font-family="Arial" fill="${color}">${text}</text>
    </svg>
  `
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}
