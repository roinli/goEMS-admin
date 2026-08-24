import {
  history,
  loadAlarms,
  loadStations,
  mockNumber,
  nowText,
  stationKey,
  stationTelemetry,
  trend
} from './mockTelemetry'
import { listDevice } from './device'

const VIEW_STORAGE_KEY = 'ems-opensource-monitor-views'

export function getMonitorOverview(stationId, params = {}) {
  const query = Object.assign({}, params, stationId ? { stationId } : {})
  return Promise.all([loadStations(query), loadAlarms(query), listDevice(Object.assign({ pageNum: 1, pageSize: 9999 }, query))]).then(([sourceStations, alarms, deviceResponse]) => {
    const stations = sourceStations.map(stationTelemetry)
    const devices = rowsOf(deviceResponse)
    const selectedStation = stationId
      ? stations.find(item => String(stationKey(item)) === String(stationId)) || stations[0]
      : undefined
    const stationDevices = selectedStation
      ? devices.filter(item => String(item.stationId) === String(stationKey(selectedStation)))
      : []
    const enrichedStations = stations.map(station => enrichStation(station, devices, alarms))
    const selected = selectedStation ? enrichStation(selectedStation, stationDevices, alarms) : {}
    const onlineDeviceCount = devices.filter(item => item.commStatus === 'ONLINE').length
    const summary = {
      stationCount: stations.length,
      onlineDeviceCount,
      offlineDeviceCount: devices.length - onlineDeviceCount,
      activeAlarmCount: alarms.length,
      todayGeneration: sum(stations, 'todayGeneration'),
      todayRevenue: sum(stations, 'todayRevenue')
    }
    return success({
      summary,
      stations: enrichedStations,
      alarms,
      selectedStation: selected,
      stationDevices,
      realtimeMetrics: buildRealtimeMetrics(selected),
      energyFlow: buildEnergyFlow(selected, stationDevices),
      sessionControl: { sessionSeconds: 60, remainingCount: 999, monthlyLimit: 999 },
      trend: trend(stations.map(item => stationKey(item)).join('-') || 'all')
    })
  })
}

export function getMonitorDeviceDetail(params = {}) {
  return resolveDevice(params).then(device => {
    const activePower = device.activePower || 0
    const todayGeneration = device.todayGeneration || mockNumber(device.deviceId, 201, 80, 860)
    const detail = Object.assign({}, device, {
      activePower,
      todayGeneration,
      temperature: mockNumber(device.deviceId, 202, 26, 48),
      voltage: mockNumber(device.deviceId, 203, 218, 760),
      current: mockNumber(device.deviceId, 204, 12, 180)
    })
    return success({
      detail,
      identityRows: [
        row('公司', detail.companyName, '所属公司'),
        row('电站', detail.stationName, '所属电站'),
        row('设备名称', detail.deviceName, '前端模拟设备'),
        row('设备编码', detail.deviceCode, '开源版模拟编码'),
        row('设备类型', detail.deviceType, '设备分类'),
        row('组件绑定', detail.componentBinding, '模拟绑定')
      ],
      assetRows: [
        row('厂家', detail.manufacturer, '模拟资产信息'),
        row('型号', detail.model, '模拟资产信息'),
        row('序列号', detail.serialNo, '模拟资产信息'),
        row('固件版本', detail.firmwareVersion, '模拟资产信息'),
        row('控制器', '开源版模拟控制器', '不连接真实控制器'),
        row('安装日期', '2025-01-01', '模拟资产信息')
      ],
      metricRows: [
        row('实时功率', `${detail.activePower} kW`, '前端模拟值'),
        row('今日发电', `${detail.todayGeneration} kWh`, '前端模拟值'),
        row('温度', `${detail.temperature} °C`, '前端模拟值'),
        row('电压', `${detail.voltage} V`, '前端模拟值'),
        row('电流', `${detail.current} A`, '前端模拟值'),
        row('活动告警', '0 条', '告警管理仍读取数据库')
      ],
      statusRows: [
        row('通讯状态', detail.commStatus, '前端模拟链路'),
        row('设备状态', detail.status, '前端模拟状态'),
        row('最近心跳', nowText(), '前端模拟时间'),
        row('安装位置', detail.componentAlias, '模拟安装位置')
      ],
      trend: trend(detail.deviceId)
    })
  })
}

export function getMonitorStorageDetail(deviceId) {
  return resolveDevice({ deviceId }).then(device => {
    const soc = mockNumber(device.deviceId, 220, 35, 92)
    const power = mockNumber(device.deviceId, 221, -80, 120)
    return success({
      detail: Object.assign({}, device, { activePower: power, todayGeneration: 0, soc }),
      identityRows: [
        row('设备名称', device.deviceName, '前端模拟设备'),
        row('设备编码', device.deviceCode, '开源版模拟编码'),
        row('所属电站', device.stationName, '数据库电站'),
        row('通讯状态', device.commStatus, '前端模拟链路')
      ],
      realtimeMetrics: [
        row('soc', `${soc} %`),
        row('activePower', `${power} kW`),
        row('voltage', `${mockNumber(device.deviceId, 222, 620, 760)} V`),
        row('temperature', `${mockNumber(device.deviceId, 223, 24, 39)} °C`)
      ],
      healthRows: [row('健康状态', '正常', '前端模拟结果'), row('待检测项', '0 项', '前端模拟结果')],
      storageUnits: [
        { name: '储能单元 1', soc, power },
        { name: '储能单元 2', soc: Math.max(0, soc - 2), power: Number((power * 0.94).toFixed(2)) }
      ],
      batteryPacks: Array.from({ length: 4 }, (_, index) => ({
        status: 'NORMAL',
        name: `电池包 ${index + 1}`,
        sn: `PACK-${device.deviceId}-${index + 1}`,
        power: Number((power / 4).toFixed(2)),
        voltage: mockNumber(device.deviceId, 230 + index, 156, 172),
        maxTemp: mockNumber(device.deviceId, 240 + index, 28, 38),
        minTemp: mockNumber(device.deviceId, 250 + index, 22, 29),
        totalDischarge: mockNumber(device.deviceId, 260 + index, 1800, 6200),
        firmware: 'demo-1.0.0'
      })),
      socTrend: trend(`${device.deviceId}-soc`)
    })
  })
}

export function getMonitorStorageHistory(deviceId) {
  return Promise.resolve(success(history(deviceId, `储能设备 ${deviceId}`, 'soc', '%')))
}

export function getMonitorHistory(params = {}) {
  return Promise.resolve(success(history(params.deviceId || 'device', `模拟设备 ${params.deviceId || ''}`.trim())))
}

export function getMonitorStationView(params = {}) {
  return getMonitorOverview(params.stationId, params).then(response => success(withView(response.data, params.stationId, 'PHYSICAL')))
}

export function getMonitorLogicView(params = {}) {
  return getMonitorOverview(params.stationId, params).then(response => success(withView(response.data, params.stationId, 'LOGIC')))
}

export function saveMonitorStationView(data) {
  saveView(data, 'PHYSICAL')
  return getMonitorStationView({ stationId: data.stationId, companyId: data.companyId, tabId: data.tabId })
}

export function saveMonitorLogicView(data) {
  saveView(data, 'LOGIC')
  return getMonitorLogicView({ stationId: data.stationId, companyId: data.companyId, tabId: data.tabId })
}

export function startMonitorEnergyFlowSession() {
  return Promise.resolve(success({
    sessionSeconds: 60,
    remainingCount: 999,
    monthlyLimit: 999,
    syncStatus: 'SUCCESS',
    syncAffectedRows: 0,
    syncMessage: '开源版实时数据由前端模拟'
  }))
}

export function listMonitorViewTabs(params = {}) {
  const view = loadView(params.stationId, params.viewType || 'PHYSICAL')
  return Promise.resolve(success({ stationId: params.stationId, viewType: params.viewType, tabs: [view.tab] }))
}

export function saveMonitorViewTab(data) {
  const view = loadView(data.stationId, data.viewType || 'PHYSICAL')
  view.tab = Object.assign({}, view.tab, data, { id: view.tab.id })
  persistView(data.stationId, data.viewType || 'PHYSICAL', view)
  return Promise.resolve(success(view.tab))
}

export function removeMonitorViewTab() {
  return Promise.resolve({ code: 200, msg: '删除成功' })
}

function resolveDevice(params) {
  const query = { pageNum: 1, pageSize: 9999 }
  if (params.stationId != null && params.stationId !== '') query.stationId = params.stationId
  return listDevice(query).then(response => {
    const devices = rowsOf(response)
    return devices.find(item => String(item.deviceId) === String(params.deviceId)) || devices[0] || {
      deviceId: params.deviceId || 'device',
      deviceName: '模拟设备',
      deviceType: 'OTHER',
      commStatus: 'OFFLINE',
      status: 'WARNING'
    }
  })
}

function rowsOf(response) {
  if (response && Array.isArray(response.data)) return response.data
  if (response && Array.isArray(response.rows)) return response.rows
  return []
}

function enrichStation(station, devices, alarms) {
  const id = stationKey(station)
  const ownDevices = devices.filter(item => String(item.stationId) === String(id))
  const ownAlarms = alarms.filter(item => String(item.stationId) === String(id))
  return Object.assign({}, station, {
    deviceCount: ownDevices.length,
    onlineDeviceCount: ownDevices.filter(item => item.commStatus === 'ONLINE').length,
    alarmCount: ownAlarms.length,
    stringCapacityKw: station.capacityKw,
    latestDataTime: nowText(),
    weather: '晴'
  })
}

function buildRealtimeMetrics(station) {
  if (!station || station.stationId == null) return []
  return [
    { name: 'currentPower', value: station.currentPower, unit: 'kW' },
    { name: 'generation', value: station.todayGeneration, unit: 'kWh' },
    { name: 'temperature', value: mockNumber(station.stationId, 280, 22, 38), unit: '°C' },
    { name: 'irradiation', value: mockNumber(station.stationId, 281, 420, 920), unit: 'W/m²' }
  ]
}

function buildEnergyFlow(station, devices) {
  if (!station || station.stationId == null) return { nodes: [], edges: [] }
  const inverter = devices.find(item => item.deviceType === 'INVERTER')
  const storage = devices.find(item => item.deviceType === 'ESS')
  const pvPower = Number((inverter && inverter.activePower) || station.currentPower || 0)
  const storagePower = Number((storage && storage.activePower) || 0)
  const loadPower = Number(Math.max(0, pvPower + Math.max(storagePower, 0) * 0.7).toFixed(2))
  const gridPower = Number((pvPower + storagePower - loadPower).toFixed(2))
  return {
    nodes: [
      { key: 'pv', label: '光伏', available: true, power: pvPower, deviceCount: 1 },
      { key: 'storage', label: '储能', available: true, power: storagePower, deviceCount: 1, soc: mockNumber(station.stationId, 290, 35, 92) },
      { key: 'load', label: '负载', available: true, power: loadPower, deviceCount: 1 },
      { key: 'grid', label: '电网', available: true, power: gridPower, deviceCount: 1 }
    ],
    edges: [
      { source: 'pv', target: 'load', power: pvPower },
      { source: 'storage', target: 'load', power: Math.abs(storagePower) },
      { source: 'load', target: 'grid', power: Math.abs(gridPower) }
    ],
    socialContribution: {
      coal: Number((station.todayGeneration * 0.0001229).toFixed(2)),
      co2: Number((station.todayGeneration * 0.5703).toFixed(2)),
      tree: Number((station.todayGeneration * 0.00004).toFixed(2))
    }
  }
}

function withView(base, stationId, viewType) {
  const view = loadView(stationId, viewType)
  return Object.assign({}, base, {
    viewType,
    viewTabs: [view.tab],
    activeTab: view.tab,
    viewNodes: view.nodes,
    viewRelations: view.relations,
    optimizerBindings: []
  })
}

function loadView(stationId, viewType) {
  const key = `${stationId || 'none'}-${viewType}`
  const saved = readViews()[key]
  if (saved) return saved
  const logic = viewType === 'LOGIC'
  const nodes = logic ? defaultLogicNodes() : defaultPhysicalNodes(stationId)
  return {
    tab: { id: key, stationId, tabName: logic ? '逻辑视图' : '物理视图', viewType, sortNo: 1, status: '0' },
    nodes,
    relations: defaultRelations(nodes)
  }
}

function saveView(data, viewType) {
  const current = loadView(data.stationId, viewType)
  persistView(data.stationId, viewType, {
    tab: Object.assign({}, current.tab, { tabName: data.tabName || current.tab.tabName }),
    nodes: Array.isArray(data.nodes) ? data.nodes : current.nodes,
    relations: Array.isArray(data.relations) ? data.relations : current.relations
  })
}

function persistView(stationId, viewType, view) {
  if (typeof window === 'undefined') return
  const views = readViews()
  views[`${stationId || 'none'}-${viewType}`] = view
  window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(views))
}

function readViews() {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) || '{}')
  } catch (error) {
    return {}
  }
}

function defaultPhysicalNodes(stationId) {
  return [
    node('pv-area', 'INVERTER_AREA', 10, 18, 6, 9, null, '逆变器区'),
    node('inverter', 'INVERTER', 34, 18, 6, 9, `${stationId}-1`, '逆变器'),
    node('storage', 'STORAGE_AREA', 34, 65, 6, 9, `${stationId}-2`, '储能区'),
    node('grid', 'GRID_POINT', 72, 42, 6, 9, `${stationId}-3`, '并网点')
  ]
}

function defaultLogicNodes() {
  return [
    node('pv', 'PV', 12, 12, 6, 9, null, '光伏阵列', 'pv'),
    node('inverter', 'INVERTER', 38, 12, 6, 9, null, '逆变器'),
    node('bus', 'BUS', 62, 40, 6, 9, null, '交流母线'),
    node('storage', 'ESS', 38, 68, 6, 9, null, '储能系统', 'storage'),
    node('load', 'LOAD', 78, 18, 6, 9, null, '负载', 'load'),
    node('grid', 'GRID', 78, 66, 6, 9, null, '电网', 'grid')
  ]
}

function defaultRelations(nodes) {
  return nodes.slice(1).map((item, index) => ({
    sourceKey: nodes[index].clientKey,
    targetKey: item.clientKey,
    relationType: 'CONNECT',
    sortNo: index + 1
  }))
}

function node(clientKey, nodeType, x, y, width, height, deviceId, label, flowKey) {
  return {
    clientKey,
    nodeType,
    x,
    y,
    width,
    height,
    deviceId,
    sortNo: 1,
    nodeStyleJson: JSON.stringify({ label, flowKey })
  }
}

function row(label, value, remark = '') {
  return { label, value: value == null || value === '' ? '--' : value, remark }
}

function sum(rows, key) {
  return Number(rows.reduce((total, item) => total + Number(item[key] || 0), 0).toFixed(2))
}

function success(data) {
  return { code: 200, data }
}
