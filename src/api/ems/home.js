import { loadAlarms, loadStations, stationTelemetry, trend } from './mockTelemetry'

export function getHomeListSummary(params = {}) {
  return Promise.all([
    loadStations(params),
    loadAlarms({ companyId: params.companyId, stationId: params.stationId })
  ]).then(([stations, alarms]) => {
    const stationRows = stations.map(stationTelemetry)
    const todayGeneration = sum(stationRows, 'todayGeneration')
    const todayRevenue = sum(stationRows, 'todayRevenue')
    const onlineDevices = stationRows.reduce((total, station) => total + 2, 0)
    return {
      code: 200,
      data: {
        summaryCards: [
          card('电站数量', stationRows.length, '座', '数据库实时统计'),
          card('在线设备', onlineDevices, '台', '前端模拟数据'),
          card('今日发电', todayGeneration, 'kWh', '前端模拟数据'),
          card('今日收益', todayRevenue, '元', '按模拟发电量估算')
        ],
        stationRows,
        alarmRows: alarms.map(item => ({
          time: item.firstTime || item.alarmTime || item.createTime,
          companyId: item.companyId,
          stationId: item.stationId,
          deviceId: item.deviceId,
          stationName: item.stationName,
          deviceName: item.deviceName,
          severity: item.severity,
          message: item.message || item.alarmName
        })),
        chartData: trend(stationRows.map(item => item.stationId).join('-') || 'empty')
      }
    }
  })
}

function sum(rows, key) {
  return Number(rows.reduce((total, item) => total + Number(item[key] || 0), 0).toFixed(2))
}

function card(title, value, unit, subtitle) {
  return { title, value, unit, subtitle }
}
