let glScriptPromise = null

export function loadTencentMapScript(key) {
  if (window.TMap) {
    return Promise.resolve(window.TMap)
  }
  if (glScriptPromise) {
    return glScriptPromise
  }
  glScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://map.qq.com/api/gljs?v=1.1&key=${key}&callback=__emsTencentMapReady`
    script.onerror = error => {
      glScriptPromise = null
      reject(error)
    }
    window.__emsTencentMapReady = () => {
      delete window.__emsTencentMapReady
      resolve(window.TMap)
    }
    document.head.appendChild(script)
  })
  return glScriptPromise
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
