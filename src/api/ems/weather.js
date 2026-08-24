import { mockNumber } from './mockTelemetry'

export function getStationWeather(stationId) {
  const today = new Date()
  const daily = Array.from({ length: 4 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index)
    const min = Math.round(mockNumber(stationId, 100 + index, 17, 25))
    return {
      date: formatDate(date),
      weatherCode: index % 3 === 1 ? 2 : 0,
      minTemperature: min,
      maxTemperature: min + Math.round(mockNumber(stationId, 110 + index, 5, 10)),
      maxWindSpeed: mockNumber(stationId, 120 + index, 1, 5)
    }
  })
  return Promise.resolve({
    code: 200,
    data: {
      stationId,
      current: {
        temperature: daily[0].maxTemperature - 2,
        weatherCode: daily[0].weatherCode,
        windSpeed: daily[0].maxWindSpeed,
        time: new Date().toISOString()
      },
      daily
    }
  })
}

function formatDate(date) {
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
