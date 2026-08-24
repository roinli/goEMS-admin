<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import * as echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

const REPORT_COLORS = ['#EFB060', '#74D186', '#5B7BD5']
const HISTORY_COLOR = '#5BDBD0'

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '350px'
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    variant: {
      type: String,
      default: 'default'
    },
    xAxisData: {
      type: Array,
      default: () => []
    },
    seriesNames: {
      type: Array,
      default: () => []
    },
    yAxisName: {
      type: String,
      default: ''
    },
    chartData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler(val) {
        this.setOptions(val)
      }
    },
    xAxisData() {
      this.setOptions(this.chartData)
    },
    seriesNames() {
      this.setOptions(this.chartData)
    },
    yAxisName() {
      this.setOptions(this.chartData)
    },
    variant() {
      this.setOptions(this.chartData)
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      const usePlainTheme = this.variant === 'report' || this.variant === 'history'
      this.chart = echarts.init(this.$el, usePlainTheme ? null : 'macarons')
      this.setOptions(this.chartData)
    },
    buildReportSeries(name, data, colorIndex) {
      const color = REPORT_COLORS[colorIndex % REPORT_COLORS.length]
      return {
        name: name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: true,
        clip: false,
        itemStyle: {
          color: '#fff',
          borderColor: color,
          borderWidth: 2
        },
        lineStyle: {
          color: color,
          width: 2
        },
        data: data,
        animationDuration: 800,
        animationEasing: 'cubicOut'
      }
    },
    buildHistorySeries(name, data) {
      return {
        name: name,
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        itemStyle: {
          color: HISTORY_COLOR
        },
        lineStyle: {
          color: HISTORY_COLOR,
          width: 1.5
        },
        data: data,
        animationDuration: 600,
        animationEasing: 'cubicOut'
      }
    },
    resolveYAxisName(chartData = {}) {
      return this.yAxisName || chartData.unit || chartData.yAxisName || ''
    },
    setOptions({ expectedData = [], actualData = [], xAxisData: dataXAxisData = [], seriesNames: dataSeriesNames = [], unit, yAxisName } = {}) {
      if (!this.chart) {
        return
      }
      const xAxisData = this.xAxisData && this.xAxisData.length ? this.xAxisData : dataXAxisData
      const legendNames = this.seriesNames && this.seriesNames.length
        ? this.seriesNames
        : (dataSeriesNames && dataSeriesNames.length ? dataSeriesNames : ['参考值', '实际值'])
      const series = []
      const isReport = this.variant === 'report'
      const isHistory = this.variant === 'history'
      const axisUnit = this.resolveYAxisName({ unit, yAxisName })

      if (expectedData && expectedData.length) {
        if (isHistory) {
          series.push(this.buildHistorySeries(legendNames[0] || '参考值', expectedData))
        } else if (isReport) {
          series.push(this.buildReportSeries(legendNames[0] || '参考值', expectedData, 0))
        } else {
          series.push({
            name: legendNames[0] || '参考值',
            itemStyle: {
              normal: {
                color: '#FF005A',
                lineStyle: {
                  color: '#FF005A',
                  width: 2
                }
              }
            },
            smooth: true,
            type: 'line',
            data: expectedData,
            animationDuration: 2800,
            animationEasing: 'cubicInOut'
          })
        }
      }
      if (actualData && actualData.length) {
        const actualName = expectedData && expectedData.length
          ? (legendNames[1] || '实际值')
          : (legendNames.length > 1 ? legendNames[1] : (legendNames[0] || '实际值'))
        if (isHistory) {
          series.push(this.buildHistorySeries(actualName, actualData))
        } else if (isReport) {
          series.push(this.buildReportSeries(actualName, actualData, expectedData && expectedData.length ? 1 : 0))
        } else {
          series.push({
            name: actualName,
            smooth: true,
            type: 'line',
            itemStyle: {
              normal: {
                color: '#3888fa',
                lineStyle: {
                  color: '#3888fa',
                  width: 2
                },
                areaStyle: {
                  color: '#f3f8ff'
                }
              }
            },
            data: actualData,
            animationDuration: 2800,
            animationEasing: 'quadraticOut'
          })
        }
      }

      // 报表空数据仍保留坐标系与图例，避免整块空白
      if (isReport && !series.length) {
        const names = legendNames.length ? legendNames : ['参考值', '实际值']
        names.forEach((name, index) => {
          series.push(this.buildReportSeries(name || ('系列' + (index + 1)), [], index))
        })
      }

      if (isHistory) {
        this.chart.setOption({
          color: [HISTORY_COLOR],
          legend: {
            data: series.map(item => item.name),
            top: 0,
            left: 0,
            icon: 'rect',
            itemWidth: 14,
            itemHeight: 2,
            itemGap: 12,
            textStyle: { color: 'rgba(0,0,0,0.65)', fontSize: 12 }
          },
          grid: {
            left: 16,
            right: 24,
            bottom: 56,
            top: 40,
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#fff',
            borderColor: 'transparent',
            borderWidth: 0,
            padding: [10, 14],
            textStyle: { color: 'rgba(0,0,0,0.85)', fontSize: 12 },
            extraCssText: 'box-shadow: 0 2px 12px rgba(0,0,0,0.12); border-radius: 4px;',
            axisPointer: {
              type: 'line',
              lineStyle: { color: '#c0c4cc', type: 'solid', width: 1 }
            },
            formatter(params) {
              const list = Array.isArray(params) ? params : [params]
              if (!list.length) {
                return ''
              }
              const axis = list[0].axisValueLabel || list[0].axisValue || ''
              const lines = list.map(item => {
                const marker = `<span style="display:inline-block;margin-right:6px;width:8px;height:8px;background:${item.color};border-radius:1px;vertical-align:middle;"></span>`
                const value = item.value == null || item.value === '' ? '--' : item.value
                return `${marker}${item.seriesName} ${value}`
              })
              return `${axis}<br/>${lines.join('<br/>')}`
            }
          },
          xAxis: {
            type: 'category',
            data: xAxisData,
            boundaryGap: false,
            axisTick: {
              show: true,
              alignWithLabel: true,
              lineStyle: { color: '#d9d9d9' }
            },
            axisLine: { lineStyle: { color: '#e5e5e5' } },
            axisLabel: {
              color: 'rgba(0,0,0,0.45)',
              hideOverlap: true
            }
          },
          yAxis: {
            type: 'value',
            name: axisUnit,
            nameTextStyle: {
              color: 'rgba(0,0,0,0.45)',
              align: 'left',
              padding: [0, 0, 0, 0]
            },
            axisTick: { show: false },
            axisLine: { show: false },
            splitLine: {
              show: true,
              lineStyle: { color: '#e8e8e8', type: 'dashed' }
            },
            axisLabel: { color: 'rgba(0,0,0,0.45)' }
          },
          dataZoom: [
            {
              type: 'inside',
              xAxisIndex: 0,
              filterMode: 'none'
            },
            {
              type: 'slider',
              xAxisIndex: 0,
              height: 22,
              bottom: 8,
              borderColor: '#d6e4ff',
              backgroundColor: 'rgba(64, 128, 255, 0.06)',
              fillerColor: 'rgba(64, 128, 255, 0.12)',
              handleIcon: 'path://M-4,-10 L4,-10 L4,10 L-4,10 Z',
              handleSize: '110%',
              handleStyle: {
                color: '#5B8FF9',
                borderColor: '#5B8FF9'
              },
              moveHandleSize: 0,
              dataBackground: {
                lineStyle: { color: HISTORY_COLOR, width: 1, opacity: 0.6 },
                areaStyle: { color: 'rgba(91, 219, 208, 0.12)' }
              },
              selectedDataBackground: {
                lineStyle: { color: HISTORY_COLOR, width: 1 },
                areaStyle: { color: 'rgba(91, 219, 208, 0.18)' }
              },
              textStyle: { color: 'rgba(0,0,0,0.45)', fontSize: 10 }
            }
          ],
          series: series
        }, true)
        return
      }

      if (isReport) {
        this.chart.setOption({
          color: REPORT_COLORS,
          xAxis: {
            type: 'category',
            data: xAxisData,
            boundaryGap: false,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e5e5e5' } },
            axisLabel: { color: 'rgba(0,0,0,0.45)' }
          },
          grid: {
            left: 16,
            right: 24,
            bottom: 32,
            top: 40,
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'line',
              lineStyle: { color: '#c0c4cc', type: 'dashed' }
            },
            padding: [8, 12]
          },
          yAxis: {
            type: 'value',
            axisTick: { show: false },
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#f0f0f0', type: 'solid' } },
            axisLabel: { color: 'rgba(0,0,0,0.45)' }
          },
          legend: {
            data: series.map(item => item.name),
            top: 0,
            right: 0,
            icon: 'circle',
            itemWidth: 8,
            itemHeight: 8,
            itemGap: 16,
            textStyle: { color: 'rgba(0,0,0,0.65)', fontSize: 12 }
          },
          series: series
        }, true)
        return
      }

      this.chart.setOption({
        xAxis: {
          data: xAxisData,
          boundaryGap: false,
          axisTick: {
            show: false
          }
        },
        grid: {
          left: 10,
          right: 10,
          bottom: 20,
          top: 30,
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          padding: [5, 10]
        },
        yAxis: {
          axisTick: {
            show: false
          }
        },
        legend: {
          data: series.map(item => item.name)
        },
        series: series
      })
    }
  }
}
</script>
