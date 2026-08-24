import kpiCurrentPowerIcon from '@/assets/images/kpi/current-power.svg'
import kpiTodayGenerationIcon from '@/assets/images/kpi/today-generation.svg'
import kpiTodayRevenueIcon from '@/assets/images/kpi/today-revenue.svg'
import kpiTotalGenerationIcon from '@/assets/images/kpi/total-generation.svg'
import kpiInverterCapacityIcon from '@/assets/images/kpi/inverter-capacity.svg'
import kpiStorageCapacityIcon from '@/assets/images/kpi/storage-capacity.svg'
import kpiTodayChargeIcon from '@/assets/images/kpi/today-charge.svg'
import kpiTodayDischargeIcon from '@/assets/images/kpi/today-discharge.svg'
import kpiTotalChargeIcon from '@/assets/images/kpi/total-charge.svg'
import kpiTotalDischargeIcon from '@/assets/images/kpi/total-discharge.svg'
import dedicateCoalIcon from '@/assets/images/home/dedicate_coal.png'
import dedicateCo2Icon from '@/assets/images/home/dedicate_co2.png'
import dedicateTreeIcon from '@/assets/images/home/dedicate_tree.png'

export function getPayload(response) {
  return response && response.data !== undefined ? response.data : response || {}
}

export function getRows(payload) {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload && Array.isArray(payload.rows)) {
    return payload.rows
  }
  if (payload && Array.isArray(payload.list)) {
    return payload.list
  }
  if (payload && Array.isArray(payload.records)) {
    return payload.records
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data
  }
  return []
}

export function toNumber(value, fallback) {
  const num = Number(value)
  if (Number.isNaN(num)) {
    return fallback === undefined ? 0 : fallback
  }
  return num
}

export function metricValue(summaryCards, title, fallback) {
  const cards = summaryCards || []
  const found = cards.find(item => item.title === title)
  return found && found.value !== undefined ? found.value : fallback
}

export function formatNumber(value, digits) {
  const num = toNumber(value, 0)
  return Number(num).toFixed(digits === undefined ? 2 : digits)
}

export function formatDisplayNumber(value, digits, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback === undefined ? '--' : fallback
  }
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return fallback === undefined ? '--' : fallback
  }
  return num.toFixed(digits === undefined ? 2 : digits)
}

export function buildCompanyMap(companyRows) {
  const map = {}
  ;(companyRows || []).forEach(item => {
    map[item.companyId] = item
  })
  return map
}

export function enrichStationRows(rows, companyMap) {
  return (rows || []).map((item, index) => {
    const company = companyMap[item.companyId] || {}
    const todayGeneration = toNumber(item.todayGeneration, 0)
    const capacityKw = toNumber(item.capacityKw, 0)
    const currentPower = item.currentPower !== undefined && item.currentPower !== null
      ? toNumber(item.currentPower, 0)
      : 0
    const equivalentHours = capacityKw > 0 ? Number((todayGeneration / capacityKw).toFixed(2)) : 0
    const totalGeneration = item.totalGeneration !== undefined && item.totalGeneration !== null
      ? toNumber(item.totalGeneration, 0)
      : 0
    const yearGeneration = item.yearGeneration !== undefined && item.yearGeneration !== null
      ? toNumber(item.yearGeneration, 0)
      : toNumber(item.annualGeneration, 0)
    return {
      stationId: item.stationId,
      companyId: item.companyId,
      stationName: item.stationName || '未命名电站',
      stationCode: item.stationCode || '--',
      stationDesc: item.stationDesc || '',
      remark: item.remark || '',
      companyName: item.companyName || company.companyName || '--',
      country: item.country || company.country || '--',
      address: item.address || company.address || '--',
      longitude: item.longitude,
      latitude: item.latitude,
      commissionDate: item.commissionDate,
      capacityKw: capacityKw,
      stationType: item.stationType || 'OTHER',
      status: item.status || 'UNKNOWN',
      edgeId: item.edgeId || '',
      edgeName: item.edgeName || '',
      edgeBinding: item.edgeBinding || '',
      todayGeneration: todayGeneration,
      todayRevenue: toNumber(item.todayRevenue, 0),
      revenueStatus: item.revenueStatus || 'MISSING',
      revenueMessage: item.revenueMessage || '',
      syncStatus: item.syncStatus || 'MISSING',
      syncMessage: item.syncMessage || '',
      latestSampleTime: item.latestSampleTime || item.latestDataTime || '',
      lastSyncAttemptTime: item.lastSyncAttemptTime || '',
      currentPower: currentPower,
      equivalentHours: equivalentHours,
      totalGeneration: totalGeneration,
      yearGeneration: yearGeneration,
      co2Factor: item.co2Factor,
      coalFactor: item.coalFactor,
      treeFactor: item.treeFactor,
      optimizerCount: toNumber(item.optimizerCount, 0),
      storageLabel: item.stationType === 'STORAGE' ? '是' : '--',
      storageCapacity: toNumber(item.storageCapacity, 0),
      todayChargeKwh: toNumber(item.todayChargeKwh, 0),
      todayDischargeKwh: toNumber(item.todayDischargeKwh, 0),
      totalChargeKwh: toNumber(item.totalChargeKwh, 0),
      totalDischargeKwh: toNumber(item.totalDischargeKwh, 0),
      thumbnailSeed: index % 4
    }
  })
}

export function buildStatusSegments(stationRows) {
  const rows = stationRows || []
  const normal = rows.filter(item => item.status === 'NORMAL').length
  const fault = rows.filter(item => item.status === 'WARNING' || item.status === 'FAULT').length
  const offline = rows.filter(item => item.status === 'DISABLED').length
  return [
    { name: '正常电站', value: normal, itemStyle: { color: '#74cf53' }},
    { name: '故障电站', value: fault, itemStyle: { color: '#ff5b45' }},
    { name: '断连电站', value: offline, itemStyle: { color: '#b8c3d1' }}
  ]
}

export function buildAlarmSegments(alarmRows) {
  const totals = {
    EMERGENCY: 0,
    IMPORTANT: 0,
    SECONDARY: 0,
    PROMPT: 0
  }
  ;(alarmRows || []).forEach((item) => {
    const severity = item.severity
    if (severity === 'CRITICAL') {
      totals.EMERGENCY += 1
    } else if (severity === 'HIGH' || severity === 'IMPORTANT') {
      totals.IMPORTANT += 1
    } else if (severity === 'MEDIUM' || severity === 'SECONDARY') {
      totals.SECONDARY += 1
    } else if (severity === 'LOW' || severity === 'PROMPT') {
      totals.PROMPT += 1
    }
  })
  return [
    { name: '紧急告警', value: totals.EMERGENCY, itemStyle: { color: '#e44545' }},
    { name: '重要告警', value: totals.IMPORTANT, itemStyle: { color: '#ff8000' }},
    { name: '次要告警', value: totals.SECONDARY, itemStyle: { color: '#ffc641' }},
    { name: '提示告警', value: totals.PROMPT, itemStyle: { color: '#4faff5' }}
  ]
}

export function buildHeroMetrics(summaryCards, stationRows) {
  return buildKpiMetrics(DEFAULT_KPI_KEYS, summaryCards, stationRows)
}

export const KPI_PARAM_GROUPS = [
  {
    key: 'PV',
    label: '光伏场景',
    params: [
      { key: 'currentPower', label: '当前功率', unit: 'kW', icon: kpiCurrentPowerIcon },
      { key: 'todayGeneration', label: '当日发电量', unit: '度', icon: kpiTodayGenerationIcon },
      { key: 'todayRevenue', label: '当日收益', unit: '元', icon: kpiTodayRevenueIcon },
      { key: 'totalGeneration', label: '累计发电量', unit: '度', icon: kpiTotalGenerationIcon },
      { key: 'inverterCapacity', label: '逆变器额定功率', unit: 'kW', icon: kpiInverterCapacityIcon }
    ]
  },
  {
    key: 'STORAGE',
    label: '储能场景',
    params: [
      { key: 'storageCapacity', label: '储能额定容量', unit: '度', icon: kpiStorageCapacityIcon },
      { key: 'todayCharge', label: '当日充电量', unit: '度', icon: kpiTodayChargeIcon },
      { key: 'todayDischarge', label: '当日放电量', unit: '度', icon: kpiTodayDischargeIcon },
      { key: 'totalCharge', label: '累计充电量', unit: '度', icon: kpiTotalChargeIcon },
      { key: 'totalDischarge', label: '累计放电量', unit: '度', icon: kpiTotalDischargeIcon }
    ]
  }
]

export const DEFAULT_KPI_KEYS = ['currentPower', 'todayGeneration', 'todayRevenue', 'totalGeneration', 'inverterCapacity', 'storageCapacity']

export const MAX_KPI_KEYS = 6

export function findKpiParam(key) {
  for (let groupIndex = 0; groupIndex < KPI_PARAM_GROUPS.length; groupIndex += 1) {
    const group = KPI_PARAM_GROUPS[groupIndex]
    const found = group.params.find(item => item.key === key)
    if (found) {
      return found
    }
  }
  return null
}

export function normalizeKpiKeys(keys) {
  const valid = []
  ;(keys || []).forEach(key => {
    if (findKpiParam(key) && valid.indexOf(key) === -1) {
      valid.push(key)
    }
  })
  const result = valid.slice(0, MAX_KPI_KEYS)
  return result.length ? result : DEFAULT_KPI_KEYS.slice()
}

function buildKpiValueMap(summaryCards, stationRows) {
  const rows = stationRows || []
  const sum = field => rows.reduce((total, item) => total + toNumber(item[field], 0), 0)
  const totalGeneration = sum('totalGeneration')
  return {
    currentPower: { value: formatNumber(sum('currentPower'), 2), unit: 'kW' },
    todayGeneration: { value: formatNumber(metricValue(summaryCards, '今日发电', sum('todayGeneration')), 2), unit: '度' },
    todayRevenue: { value: formatNumber(metricValue(summaryCards, '今日收益', 0), 2), unit: '元' },
    totalGeneration: { value: formatNumber(totalGeneration, 2), unit: '度' },
    inverterCapacity: { value: formatNumber(sum('capacityKw'), 2), unit: 'kW' },
    storageCapacity: { value: formatNumber(sum('storageCapacity'), 2), unit: '度' },
    todayCharge: { value: formatNumber(sum('todayChargeKwh'), 2), unit: '度' },
    todayDischarge: { value: formatNumber(sum('todayDischargeKwh'), 2), unit: '度' },
    totalCharge: { value: formatNumber(sum('totalChargeKwh'), 2), unit: '度' },
    totalDischarge: { value: formatNumber(sum('totalDischargeKwh'), 2), unit: '度' }
  }
}

export function buildKpiMetrics(selectedKeys, summaryCards, stationRows) {
  const keys = normalizeKpiKeys(selectedKeys)
  const valueMap = buildKpiValueMap(summaryCards, stationRows)
  return keys.map(key => {
    const param = findKpiParam(key)
    const resolved = valueMap[key] || { value: formatNumber(0, 2), unit: param ? param.unit : '' }
    return {
      key: key,
      label: param ? param.label : key,
      value: resolved.value,
      unit: resolved.unit,
      icon: param ? param.icon : kpiTotalGenerationIcon
    }
  })
}

export function buildGenerationXAxis() {
  const list = []
  for (let index = 0; index < 24; index += 1) {
    list.push(index < 10 ? '0' + index : String(index))
  }
  return list
}

export function buildZeroSeries(length) {
  return Array.from({ length }, () => 0)
}

export function buildGenerationValues(chartData) {
  const payload = chartData || {}
  if (payload.actualData && payload.actualData.length) {
    return payload.actualData
  }
  if (payload.expectedData && payload.expectedData.length) {
    return payload.expectedData
  }
  if (payload.xAxisData && payload.xAxisData.length) {
    return buildZeroSeries(payload.xAxisData.length)
  }
  return buildZeroSeries(24)
}

export function buildRankingRows(stationRows) {
  return (stationRows || []).map(item => ({
    stationId: item.stationId,
    companyId: item.companyId,
    name: item.stationName,
    value: Number(item.equivalentHours || 0)
  })).sort((left, right) => right.value - left.value)
}

export function buildContributionCards(stationRows, businessParams) {
  const rows = stationRows || []
  const params = businessParams || {}
  const globalCoal = toNumber(params.standard_coal_factor, 0)
  const globalCo2 = toNumber(params.co2_factor, 0)
  const globalTree = toNumber(params.tree_factor, 0)
  let coalKg = 0
  let co2Kg = 0
  let treeCount = 0
  let yearCoalKg = 0
  let yearCo2Kg = 0
  let yearTreeCount = 0
  rows.forEach(item => {
    const generation = toNumber(item.totalGeneration, 0)
    const yearGeneration = toNumber(item.yearGeneration !== undefined ? item.yearGeneration : item.annualGeneration, 0)
    const coalFactor = item.coalFactor !== undefined && item.coalFactor !== null ? toNumber(item.coalFactor, globalCoal) : globalCoal
    const co2Factor = item.co2Factor !== undefined && item.co2Factor !== null ? toNumber(item.co2Factor, globalCo2) : globalCo2
    const treeFactor = item.treeFactor !== undefined && item.treeFactor !== null ? toNumber(item.treeFactor, globalTree) : globalTree
    const stationCo2 = generation * co2Factor
    const stationYearCo2 = yearGeneration * co2Factor
    coalKg += generation * coalFactor
    co2Kg += stationCo2
    treeCount += treeFactor > 0 ? stationCo2 / treeFactor : 0
    yearCoalKg += yearGeneration * coalFactor
    yearCo2Kg += stationYearCo2
    yearTreeCount += treeFactor > 0 ? stationYearCo2 / treeFactor : 0
  })
  return [
    {
      key: 'coal',
      label: '节约标准煤',
      value: formatNumber(coalKg / 1000, 3),
      yearValue: formatNumber(yearCoalKg / 1000, 3),
      totalValue: formatNumber(coalKg / 1000, 3),
      unit: '吨',
      icon: 'el-icon-shopping-bag-1',
      iconSrc: dedicateCoalIcon,
      tone: 'purple'
    },
    {
      key: 'co2',
      label: 'CO₂减排量',
      value: formatNumber(co2Kg / 1000, 3),
      yearValue: formatNumber(yearCo2Kg / 1000, 3),
      totalValue: formatNumber(co2Kg / 1000, 3),
      unit: '吨',
      icon: 'el-icon-office-building',
      iconSrc: dedicateCo2Icon,
      tone: 'blue'
    },
    {
      key: 'tree',
      label: '等效植树量',
      value: formatNumber(treeCount, 0),
      yearValue: formatNumber(yearTreeCount, 0),
      totalValue: formatNumber(treeCount, 0),
      unit: '棵',
      icon: 'el-icon-magic-stick',
      iconSrc: dedicateTreeIcon,
      tone: 'green'
    }
  ]
}

export function buildMarkerRows(stationRows) {
  const presets = [
    { left: '48%', top: '34%' },
    { left: '44%', top: '64%' },
    { left: '60%', top: '78%' },
    { left: '68%', top: '56%' },
    { left: '74%', top: '38%' },
    { left: '54%', top: '46%' }
  ]
  return (stationRows || []).map((item, index) => {
    const preset = presets[index % presets.length]
    return {
      stationId: item.stationId,
      stationName: item.stationName,
      status: item.status,
      left: preset.left,
      top: preset.top,
      color: item.status === 'WARNING' || item.status === 'FAULT'
        ? '#ff8f2b'
        : item.status === 'NORMAL'
          ? '#74cf53'
          : '#b8c3d1'
    }
  })
}

export const HOME_EMPTY_STATE = {
  summaryCards: [],
  businessParams: {
    standard_coal_factor: 0,
    co2_factor: 0,
    tree_factor: 0
  },
  stationRows: [],
  alarmRows: [],
  chartData: {
    actualData: [],
    expectedData: [],
    xAxisData: []
  }
}
