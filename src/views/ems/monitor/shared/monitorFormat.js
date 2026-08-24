const emptyText = '--'

function normalize(value) {
  return value === undefined || value === null ? '' : String(value).trim()
}

function upper(value) {
  return normalize(value).toUpperCase()
}

function pick(map, value, fallback = emptyText) {
  const raw = normalize(value)
  if (!raw) {
    return fallback
  }
  return map[raw] || map[upper(raw)] || raw
}

export function deviceTypeText(value) {
  return pick({
    CONTROLLER: '控制器',
    EDGE: '控制器',
    INVERTER: '逆变器',
    PCS: '储能变流器',
    ESS: '储能系统',
    BATTERY: '电池',
    BMS: '电池管理系统',
    METER: '电表',
    PRODUCTION_METER: '发电计量表',
    CONSUMPTION_METER: '负荷计量表',
    GRID_METER: '并网计量表',
    EMI: '环境监测仪',
    GATEWAY: '网关',
    LOAD: '负载',
    PV: '光伏',
    GRID: '电网',
    BUS: '交流母线',
    OTHER: '其他'
  }, value)
}

export function nodeTypeText(value) {
  return pick({
    PV: '光伏阵列',
    MODULE: '组件',
    INVERTER: '逆变器',
    INVERTER_AREA: '逆变器区',
    BUS: '交流母线',
    ESS: '储能系统',
    STORAGE: '储能系统',
    STORAGE_AREA: '储能区',
    LOAD: '负载',
    GRID: '电网',
    GRID_POINT: '并网点',
    CONNECT: '连接',
    CONTROLLER: '控制器'
  }, value, '节点')
}

export function flowKeyText(value) {
  return pick({
    pv: '光伏',
    PV: '光伏',
    inverter: '逆变器',
    INVERTER: '逆变器',
    storage: '储能',
    STORAGE: '储能',
    ess: '储能',
    ESS: '储能',
    load: '负载',
    LOAD: '负载',
    grid: '电网',
    GRID: '电网',
    bus: '母线',
    BUS: '母线'
  }, value)
}

export function commStatusText(value) {
  return pick({
    ONLINE: '在线',
    OFFLINE: '离线',
    UNKNOWN: '未知',
    CONNECTED: '已连接',
    DISCONNECTED: '未连接'
  }, value, emptyText)
}

export function statusText(value) {
  return pick({
    NORMAL: '正常',
    WARNING: '告警',
    WARN: '告警',
    FAULT: '故障',
    ERROR: '异常',
    FAILED: '失败',
    DISABLED: '停用',
    ENABLED: '启用',
    ACTIVE: '活动',
    CLEARED: '已恢复',
    ACKED: '已确认',
    CONSTRUCTION: '建设中',
    ONLINE: '在线',
    OFFLINE: '离线',
    GOOD: '正常',
    BAD: '异常',
    MISSING: '缺失',
    STALE: '过期',
    PARTIAL: '部分缺失',
    PENDING: '待处理',
    READY: '就绪',
    SUCCESS: '成功',
    OK: '正常',
    UNKNOWN: '未知'
  }, value)
}

export function stationStatusText(value) {
  return pick({
    NORMAL: '正常',
    WARNING: '告警',
    WARN: '告警',
    FAULT: '故障',
    DISABLED: '停用',
    CONSTRUCTION: '建设中',
    ONLINE: '运行中',
    OFFLINE: '离线',
    UNKNOWN: '未知'
  }, value)
}

export function revenueStatusText(value) {
  return pick({
    READY: '已生成',
    SUCCESS: '已生成',
    OK: '已生成',
    WARN: '口径提示',
    WARNING: '口径提示',
    MISSING: '缺失',
    PARTIAL: '部分缺失',
    PENDING: '待生成',
    ERROR: '异常',
    FAILED: '生成失败',
    NO_DATA: '暂无数据',
    UNKNOWN: '未知'
  }, value, emptyText)
}

export function revenueStatusTip(row) {
  const status = row && row.revenueStatus !== undefined ? row.revenueStatus : row
  const message = row && row.revenueMessage ? String(row.revenueMessage).trim() : ''
  if (upper(status) === 'WARN' || upper(status) === 'WARNING') {
    return message ? `口径提示：${message}` : '当日报表已生成，但收益存在口径说明，请结合收益说明核对'
  }
  const map = {
    READY: '当日报表已生成，收益无额外质量提示',
    SUCCESS: '当日报表已生成，收益无额外质量提示',
    OK: '当日报表已生成，收益无额外质量提示',
    MISSING: message || '当日报表未生成，今日收益待补拉或电价配置待检查',
    PARTIAL: message || '部分收益数据缺失，请检查报表生成和电价配置',
    PENDING: '收益报表待生成',
    ERROR: message || '收益计算或报表生成异常',
    FAILED: message || '收益报表生成失败',
    NO_DATA: message || '暂无可计算收益数据',
    UNKNOWN: '未知收益状态'
  }
  return map[upper(status)] || message || '未知收益状态'
}

export function syncStatusText(value) {
  return pick({
    READY: '已同步',
    SUCCESS: '已同步',
    OK: '已同步',
    WARN: '同步有提示',
    WARNING: '同步有提示',
    MISSING: '未同步',
    PARTIAL: '部分同步',
    PENDING: '待同步',
    FAILED: '同步失败',
    ERROR: '异常',
    NO_DATA: '暂无数据',
    UNKNOWN: '未知'
  }, value, emptyText)
}

export function metricText(value) {
  return pick({
    activePower: '有功功率',
    active_power: '有功功率',
    activePowerKw: '有功功率',
    active_power_kw: '有功功率',
    currentPower: '当前功率',
    currentPowerKw: '当前功率',
    power: '功率',
    generation: '发电量',
    generationKwh: '发电量',
    generation_kwh: '发电量',
    generationEnergy: '发电量',
    generationEnergyKwh: '发电量',
    charge: '充电量',
    chargeEnergy: '充电量',
    charge_energy: '充电量',
    chargeKwh: '充电量',
    charge_kwh: '充电量',
    chargeEnergyKwh: '充电量',
    discharge: '放电量',
    dischargeEnergy: '放电量',
    discharge_energy: '放电量',
    dischargeKwh: '放电量',
    discharge_kwh: '放电量',
    dischargeEnergyKwh: '放电量',
    chargePower: '充电功率',
    chargePowerKw: '充电功率',
    charge_power_kw: '充电功率',
    dischargePower: '放电功率',
    dischargePowerKw: '放电功率',
    discharge_power_kw: '放电功率',
    gridImportKwh: '购电量',
    grid_import_kwh: '购电量',
    gridExportKwh: '上网电量',
    grid_export_kwh: '上网电量',
    soc: '荷电状态',
    avgSoc: '平均荷电状态',
    soh: '健康状态',
    avgSoh: '平均健康状态',
    voltage: '电压',
    current: '电流',
    temperature: '温度',
    maxTemp: '最高温度',
    minTemp: '最低温度',
    frequency: '频率',
    irradiation: '辐照度',
    irradiance: '辐照度',
    radiation: '辐照度',
    humidity: '湿度',
    windSpeed: '风速',
    alarmCount: '告警数',
    runtimeHours: '运行小时',
    peakPowerKw: '峰值功率',
    pv: '光伏功率',
    storage: '储能功率',
    load: '负载功率',
    grid: '并网功率'
  }, value)
}

export function unitText(value) {
  return pick({
    kW: 'kW',
    kw: 'kW',
    KW: 'kW',
    kWh: 'kWh',
    kwh: 'kWh',
    KWH: 'kWh',
    V: 'V',
    v: 'V',
    A: 'A',
    a: 'A',
    Hz: 'Hz',
    hz: 'Hz',
    '%': '%',
    C: '℃',
    '°C': '℃',
    '℃': '℃',
    degree: '度',
    DEGREE: '度',
    yuan: '元',
    CNY: '元'
  }, value)
}

export function qualityText(value) {
  return pick({
    GOOD: '正常',
    BAD: '异常',
    MISSING: '缺失',
    STALE: '过期',
    PARTIAL: '部分缺失',
    UNKNOWN: '未知'
  }, value)
}

export function rowValueText(row) {
  const value = row && row.value !== undefined ? row.value : row
  const label = normalize(row && row.label)
  if (value === undefined || value === null || value === '') {
    return emptyText
  }
  if (/设备类型|类型/.test(label)) {
    return deviceTypeText(value)
  }
  if (/通讯|通信|连接/.test(label)) {
    return commStatusText(value)
  }
  if (/收益状态/.test(label)) {
    return revenueStatusText(value)
  }
  if (/同步状态/.test(label)) {
    return syncStatusText(value)
  }
  if (/质量/.test(label)) {
    return qualityText(value)
  }
  if (/状态/.test(label)) {
    return statusText(value)
  }
  const raw = normalize(value)
  const translated = statusText(raw)
  return translated === raw ? raw : translated
}
