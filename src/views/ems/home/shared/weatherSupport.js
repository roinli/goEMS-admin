import weatherRainImg from '@/assets/images/monitor/wsymbol_rain_showers.png'
import weatherSunnyImg from '@/assets/images/monitor/wsymbol_sunny.png'
import weatherCloudImg from '@/assets/images/monitor/wsymbol_white_cloud.png'

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function weatherCodeText(code) {
  const value = Number(code)
  if (value === 0) return '晴'
  if (value === 1) return '晴间多云'
  if (value === 2) return '多云'
  if (value === 3) return '阴'
  if (value === 45 || value === 48) return '雾'
  if (value >= 51 && value <= 57) return '小雨'
  if (value >= 61 && value <= 67) return '雨'
  if (value >= 71 && value <= 77) return '雪'
  if (value >= 80 && value <= 82) return '阵雨'
  if (value >= 85 && value <= 86) return '阵雪'
  if (value >= 95) return '雷雨'
  return '未知'
}

export function weatherCodeIcon(code) {
  const value = Number(code)
  if (value === 0 || value === 1) return weatherSunnyImg
  if (value === 2 || value === 3 || value === 45 || value === 48) return weatherCloudImg
  return weatherRainImg
}

export function weatherWeekday(dateValue) {
  const date = new Date(String(dateValue).replace(/-/g, '/'))
  return Number.isFinite(date.getTime()) ? WEEK_LABELS[date.getDay()] : '--'
}

export function normalizeWeather(payload) {
  const source = payload || {}
  const current = source.current || {}
  const daily = Array.isArray(source.daily) ? source.daily : []
  return {
    stationId: source.stationId,
    current: {
      temperature: current.temperature,
      weatherCode: current.weatherCode,
      text: weatherCodeText(current.weatherCode),
      icon: weatherCodeIcon(current.weatherCode),
      windSpeed: current.windSpeed,
      time: current.time
    },
    daily: daily.map(item => ({
      date: item.date,
      week: weatherWeekday(item.date),
      weatherCode: item.weatherCode,
      text: weatherCodeText(item.weatherCode),
      icon: weatherCodeIcon(item.weatherCode),
      min: item.minTemperature,
      max: item.maxTemperature,
      windSpeed: item.maxWindSpeed
    }))
  }
}
