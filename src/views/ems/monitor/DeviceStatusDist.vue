<template>
  <div class="device-status-dist" :style="{ height: height }">
    <div v-if="!hasData" class="device-status-dist__empty ems-list-table__empty">
      <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
      <p class="ems-list-table__empty-text">暂无数据</p>
    </div>
    <template v-else>
      <div class="device-status-dist__chart-wrap">
        <div ref="chart" class="device-status-dist__echart" />
        <div class="device-status-dist__center">
          <div class="device-status-dist__center-value">{{ total }}</div>
          <div class="device-status-dist__center-label">{{ centerLabel }}</div>
        </div>
      </div>
      <ul class="device-status-dist__legend">
        <li v-for="item in legendItems" :key="item.name" class="device-status-dist__legend-item">
          <i class="device-status-dist__swatch" :style="{ background: item.color }" />
          <span class="device-status-dist__legend-name">{{ item.name }}</span>
          <span class="device-status-dist__legend-num">{{ item.value }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script>
import * as echarts from "echarts";
import tableEmptyIcon from "@/assets/images/empty.svg";

/** 对齐运维大屏 AlarmPanel「当前告警」配色思路，适配浅色监控页 */
const STATUS_COLORS = {
  在线设备: "#1A95E7",
  离线设备: "#FEC72F",
  活动告警: "#F6322F"
};

const FALLBACK_COLORS = ["#1A95E7", "#FEC72F", "#F6322F", "#ED693C", "#5ccbb1"];

export default {
  name: "DeviceStatusDist",
  props: {
    segments: {
      type: Array,
      default: () => []
    },
    centerLabel: {
      type: String,
      default: "总计"
    },
    height: {
      type: String,
      default: "310px"
    }
  },
  data() {
    return {
      chart: null,
      tableEmptyIcon
    };
  },
  computed: {
    legendItems() {
      return (this.segments || []).map((item, index) => ({
        name: item.name,
        value: Number(item.value) || 0,
        color: item.color || STATUS_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
      }));
    },
    total() {
      return this.legendItems.reduce((sum, item) => sum + item.value, 0);
    },
    hasData() {
      return this.legendItems.some(item => item.value > 0);
    }
  },
  watch: {
    segments: {
      deep: true,
      handler() {
        this.$nextTick(() => this.ensureChart());
      }
    },
    hasData(value) {
      if (value) {
        this.$nextTick(() => this.ensureChart());
      } else {
        this.disposeChart();
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.ensureChart();
      window.addEventListener("resize", this.onWindowResize);
    });
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWindowResize);
    this.disposeChart();
  },
  methods: {
    onWindowResize() {
      this.resize();
    },
    ensureChart() {
      if (!this.hasData || !this.$refs.chart) {
        return;
      }
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chart);
      }
      this.render();
      setTimeout(() => this.resize(), 80);
    },
    disposeChart() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
    },
    render() {
      if (!this.chart) {
        return;
      }
      const data = this.legendItems.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: item.color },
        labelLine: {
          lineStyle: {
            color: item.color,
            type: "dashed",
            width: 1
          }
        }
      }));

      this.chart.setOption(
        {
          series: [
            {
              type: "pie",
              radius: ["40%", "68%"],
              center: ["50%", "50%"],
              startAngle: 90,
              clockwise: true,
              avoidLabelOverlap: true,
              padAngle: 2,
              minAngle: 8,
              itemStyle: {
                borderRadius: 2,
                borderColor: "#fff",
                borderWidth: 2
              },
              label: {
                show: true,
                formatter(params) {
                  return `{name|${params.name}}  {val|${params.value}}`;
                },
                rich: {
                  name: {
                    color: "#707070",
                    fontSize: 12,
                    fontWeight: 400,
                    lineHeight: 18
                  },
                  val: {
                    color: "#1c1c1c",
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: 18
                  }
                }
              },
              labelLine: {
                show: true,
                length: 10,
                length2: 28,
                smooth: false,
                lineStyle: {
                  type: "dashed",
                  width: 1
                }
              },
              data
            }
          ]
        },
        true
      );
    },
    resize() {
      if (this.chart) {
        this.chart.resize();
      }
    }
  }
};
</script>

<style scoped>
.device-status-dist {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.device-status-dist__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 160px;
  box-sizing: border-box;
}

.device-status-dist__chart-wrap {
  position: relative;
  width: 100%;
  flex: 1 1 auto;
  min-height: 168px;
}

.device-status-dist__echart {
  width: 100%;
  height: 100%;
}

.device-status-dist__center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 1;
}

.device-status-dist__center-value {
  color: #1c1c1c;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.device-status-dist__center-label {
  margin-top: 4px;
  color: #707070;
  font-size: 12px;
}

.device-status-dist__legend {
  list-style: none;
  margin: 6px 0 0;
  padding: 0 8px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.device-status-dist__legend-item {
  display: flex;
  align-items: center;
  min-width: 0;
}

.device-status-dist__swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
}

.device-status-dist__legend-name {
  color: #707070;
  font-size: 12px;
  white-space: nowrap;
}

.device-status-dist__legend-num {
  margin-left: auto;
  color: #1c1c1c;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
