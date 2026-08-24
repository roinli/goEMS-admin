import request from '@/utils/request'
import { getCurrentAlarms } from '@/api/ems/alarm'

export function rowsOf(response) {
  if (Array.isArray(response)) return response
  if (response && Array.isArray(response.data)) return response.data
  if (response && Array.isArray(response.rows)) return response.rows
  if (response && response.data && Array.isArray(response.data.rows)) return response.data.rows
  return []
}

function textSeed(value) {
  return String(value == null ? '' : value).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function mockNumber(seed, salt, min, max, digits = 2) {
  const value = Math.abs(Math.sin((textSeed(seed) + salt * 37) * 12.9898) * 43758.5453) % 1
  return Number((min + value * (max - min)).toFixed(digits))
}

export function stationKey(station) {
  return station && (station.stationId != null ? station.stationId : station.id)
}

export function stationTelemetry(station, index = 0) {
  const id = stationKey(station) || index + 1
  const capacityKw = Number(station.capacityKw || station.capacity || mockNumber(id, 1, 300, 1600))
  const todayGeneration = mockNumber(id, 2, capacityKw * 1.8, capacityKw * 4.6)
  const currentPower = mockNumber(id, 3, capacityKw * 0.22, capacityKw * 0.78)
  const storageCapacity = /STORAGE|ESS|储能/i.test(String(station.stationType || ''))
    ? mockNumber(id, 4, capacityKw * 0.8, capacityKw * 1.6)
    : mockNumber(id, 4, 0, capacityKw * 0.35)
  return Object.assign({}, station, {
    stationId: id,
    capacityKw,
    currentPower,
    todayGeneration,
    yearGeneration: mockNumber(id, 5, capacityKw * 420, capacityKw * 980),
    totalGeneration: mockNumber(id, 6, capacityKw * 1800, capacityKw * 6200),
    todayRevenue: Number((todayGeneration * mockNumber(id, 7, 0.42, 0.68, 4)).toFixed(2)),
    storageCapacity,
    todayChargeKwh: mockNumber(id, 8, storageCapacity * 0.12, storageCapacity * 0.55),
    todayDischargeKwh: mockNumber(id, 9, storageCapacity * 0.1, storageCapacity * 0.48),
    totalChargeKwh: mockNumber(id, 10, storageCapacity * 80, storageCapacity * 360),
    totalDischargeKwh: mockNumber(id, 11, storageCapacity * 70, storageCapacity * 330),
    optimizerCount: Math.round(mockNumber(id, 12, 24, 260, 0)),
    revenueStatus: 'OK',
    revenueMessage: '开源版收益基于模拟发电量估算',
    syncStatus: 'OK',
    syncMessage: '开源版设备数据由前端模拟',
    latestSampleTime: nowText(),
    latestDataTime: nowText(),
    co2Factor: 0.5703,
    coalFactor: 0.0001229,
    treeFactor: 0.00004
  })
}

export function mockDevices(station) {
  if (!station) return []
  const id = stationKey(station)
  const types = [
    { type: 'INVERTER', name: '光伏逆变器' },
    { type: 'ESS', name: '储能系统' },
    { type: 'METER', name: '并网电表' }
  ]
  return types.map((item, index) => {
    const deviceId = `${id}-${index + 1}`
    const online = mockNumber(id, 30 + index, 0, 1, 3) > 0.12
    const activePower = item.type === 'ESS'
      ? mockNumber(id, 40 + index, -80, 120)
      : mockNumber(id, 40 + index, 8, Math.max(30, Number(station.capacityKw || 600) * 0.42))
    return {
      deviceId,
      deviceCode: `OPEN-${String(id).padStart(4, '0')}-${index + 1}`,
      deviceName: `${station.stationName || '电站'}-${item.name}${index + 1}`,
      deviceType: item.type,
      stationId: id,
      stationName: station.stationName,
      companyId: station.companyId,
      companyName: station.companyName,
      commStatus: online ? 'ONLINE' : 'OFFLINE',
      status: online ? 'NORMAL' : 'WARNING',
      activePower,
      todayGeneration: item.type === 'INVERTER' ? mockNumber(id, 50 + index, 120, 980) : 0,
      manufacturer: 'Open Source Demo',
      model: `OS-${item.type}-1000`,
      serialNo: `SIM${String(textSeed(deviceId)).padStart(8, '0')}`,
      firmwareVersion: 'demo-1.0.0',
      componentBinding: '前端模拟组件',
      componentAlias: `${item.name}区域`,
      lastHeartbeatTime: nowText(),
      realtimeQuality: 'GOOD',
      realtimeSampleTime: nowText()
    }
  })
}

export function mockDeviceTelemetry(device) {
  const seed = device.deviceId || device.deviceCode || device.deviceName || 'device'
  const online = mockNumber(seed, 30, 0, 1, 3) > 0.12
  const activePower = device.deviceType === 'ESS'
    ? mockNumber(seed, 40, -80, 120)
    : mockNumber(seed, 40, 8, Math.max(30, Number(device.ratedCapacity || 600) * 0.42))
  return Object.assign({
    manufacturer: 'Open Source Demo',
    model: `OS-${device.deviceType || 'OTHER'}-1000`,
    serialNo: `SIM${String(textSeed(seed)).padStart(8, '0')}`,
    firmwareVersion: 'demo-1.0.0',
    componentBinding: '前端模拟组件',
    componentAlias: `${device.deviceName || '设备'}区域`
  }, device, {
    commStatus: online ? 'ONLINE' : 'OFFLINE',
    status: online ? 'NORMAL' : 'WARNING',
    activePower,
    todayGeneration: device.deviceType === 'INVERTER' ? mockNumber(seed, 50, 120, 980) : 0,
    lastHeartbeatTime: nowText(),
    realtimeQuality: 'GOOD',
    realtimeSampleTime: nowText()
  })
}

export function trend(seed, points = 24) {
  const xAxisData = []
  const actualData = []
  const expectedData = []
  for (let index = 0; index < points; index += 1) {
    const hour = points === 24 ? index : Math.floor(index * 24 / points)
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
    xAxisData.push(`${String(hour).padStart(2, '0')}:00`)
    expectedData.push(Number((daylight * 100).toFixed(2)))
    actualData.push(Number((daylight * mockNumber(seed, 70 + index, 72, 106)).toFixed(2)))
  }
  return { xAxisData, expectedData, actualData }
}

export function history(seed, deviceName, metricKey = 'activePower', unit = 'kW') {
  const chart = trend(seed, 24)
  const historyRows = chart.xAxisData.map((time, index) => ({
    time: `${dateText()} ${time}:00`,
    deviceName,
    metricKey,
    value: chart.actualData[index],
    unit,
    quality: 'GOOD'
  }))
  return { historyRows, trend: chart }
}

export function loadStations(query = {}) {
  const params = { pageNum: 1, pageSize: 9999 }
  if (query.companyId != null && query.companyId !== '') params.companyId = query.companyId
  if (query.stationName) params.stationName = query.stationName
  if (query.status) params.status = query.status
  return request({ url: '/ems/station/list', method: 'get', params }).then(response => {
    let rows = rowsOf(response)
    if (query.stationId != null && query.stationId !== '') {
      rows = rows.filter(item => String(stationKey(item)) === String(query.stationId))
    }
    if (query.country) rows = rows.filter(item => String(item.country || '').indexOf(query.country) !== -1)
    if (query.deviceType) rows = rows.filter(item => String(item.stationType || '').toUpperCase() === String(query.deviceType).toUpperCase())
    return rows
  })
}

export function loadAlarms(query = {}) {
  return getCurrentAlarms(Object.assign({ pageNum: 1, pageSize: 9999 }, query))
    .then(rowsOf)
    .catch(() => [])
}

export function nowText() {
  const date = new Date()
  return `${dateText(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function dateText(value = new Date()) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function pad(value) {
  return String(value).padStart(2, '0')
}
