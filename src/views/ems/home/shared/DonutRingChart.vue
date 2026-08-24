<template>
  <div :class="className" :style="{ height: height, width: width }" />
</template>

<script>
import * as echarts from 'echarts'
import resize from '@/views/dashboard/mixins/resize'

export default {
  name: 'DonutRingChart',
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
      default: '220px'
    },
    segments: {
      type: Array,
      default: () => []
    },
    centerValue: {
      type: [String, Number],
      default: 0
    },
    centerLabel: {
      type: String,
      default: ''
    },
    dark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    segments: {
      deep: true,
      handler() {
        this.setOptions()
      }
    },
    centerValue() {
      this.setOptions()
    },
    centerLabel() {
      this.setOptions()
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.chart = echarts.init(this.$el)
      this.setOptions()
      this.chart.resize()
    })
    window.addEventListener('resize', this.handleRootResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleRootResize)
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    rootFontSize() {
      const size = parseFloat(window.getComputedStyle(document.documentElement).fontSize)
      return Number.isFinite(size) && size > 0 ? size : 14
    },
    handleRootResize() {
      if (!this.chart) {
        return
      }
      this.setOptions()
      this.chart.resize()
    },
    setOptions() {
      if (!this.chart) {
        return
      }
      const rem = this.rootFontSize()
      const textColor = this.dark ? '#ffffff' : '#1f2d3d'
      const subColor = this.dark ? 'rgba(255,255,255,0.55)' : '#7a8699'
      const data = this.segments && this.segments.length ? this.segments : [{ name: '暂无数据', value: 1, itemStyle: { color: '#dfe7f5' }}]
      this.chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}'
        },
        series: [
          {
            type: 'pie',
            radius: ['65%', '80%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false
            },
            labelLine: {
              show: false
            },
            itemStyle: {
              borderWidth: 0
            },
            data
          }
        ],
        graphic: [
          {
            type: 'text',
            left: 'center',
            top: '40%',
            style: {
              text: String(this.centerValue),
              textAlign: 'center',
              fill: textColor,
              fontSize: Math.round(1.375 * rem),
              fontWeight: 600
            }
          },
          {
            type: 'text',
            left: 'center',
            top: '54%',
            style: {
              text: this.centerLabel,
              textAlign: 'center',
              fill: subColor,
              fontSize: Math.round(0.75 * rem)
            }
          }
        ]
      })
    }
  }
}
</script>
