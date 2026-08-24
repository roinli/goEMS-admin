<template>
  <section class="nco-home-container-toolbar">
    <div
      class="nco-home-banner"
      :class="collapsed ? 'nco-home-banner-hide' : 'nco-home-banner-show'"
    >
      <div v-show="!collapsed" class="nco-home-banner-card">
        <div class="nco-home-kpi-card">
          <div class="nco-site-kpi-card">
            <div class="nco-site-kpi-title">
              <span class="nco-site-kpi-titleWord">电站KPI</span>
              <div class="nco-firlter-params" title="选择参数">
                <i
                  ref="kpiSettingTrigger"
                  class="el-icon-setting"
                  @click="handleSetting"
                />
              </div>
              <button type="button" class="nco-site-kpi-more" title="更多" @click="goReportOverview">
                <i class="el-icon-arrow-right" />
              </button>
            </div>
            <div class="nco-site-kpi-card-optional">
              <ul>
                <li v-for="item in metrics" :key="item.key">
                  <div class="nco-kpi-counter-value">
                    <div class="counter-value-icon">
                      <img :src="item.icon" :alt="item.label">
                    </div>
                    <div class="counter-value-main">
                      <div class="counter-value-main-value">
                        <span class="value">{{ item.value }}</span>
                        <span class="unit-and-increase">
                          <span class="unit">{{ item.unit }}</span>
                        </span>
                      </div>
                      <div class="counter-value-main-title">{{ item.label }}</div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="nco-home-status-card">
          <div class="nco-site-status-card">
            <div class="nco-site-status-title">
              <span>电站状态</span>
              <button type="button" class="nco-site-status-card-more" title="更多" @click="goStatusOverview">
                <i class="el-icon-arrow-right" />
              </button>
            </div>
            <div class="nco-site-status-echarts-container">
              <div class="nco-site-status-echarts">
                <donut-ring-chart
                  :segments="statusSegments"
                  :center-value="stationTotal"
                  center-label="电站总数"
                  dark
                  height="100%"
                  width="100%"
                />
              </div>
              <div class="legend-container">
                <button
                  v-for="item in statusSegments"
                  :key="item.name"
                  type="button"
                  class="legend-item"
                  @click="handleStatusLegend(item)"
                >
                  <span class="legend-icon circle" :style="{ background: item.itemStyle.color }" />
                  <span class="legend-text">
                    <span class="value">{{ item.value }}</span>
                    <span class="title">{{ item.name }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="nco-home-alarm-card">
          <div class="nco-realtime-alarm-card">
            <div class="nco-realtime-alarm-title">
              <span>当前告警</span>
              <button type="button" class="nco-realtime-alarm-card-more" title="更多" @click="goAlarmOverview">
                <i class="el-icon-arrow-right" />
              </button>
            </div>
            <div class="nco-realtime-alarm-echarts-container">
              <div class="nco-realtime-alarm-echarts">
                <donut-ring-chart
                  :segments="alarmSegments"
                  :center-value="alarmTotal"
                  center-label="告警总数"
                  dark
                  height="100%"
                  width="100%"
                />
              </div>
              <div class="legend-container">
                <button
                  v-for="item in alarmItems"
                  :key="item.name"
                  type="button"
                  class="legend-item"
                  @click="handleAlarmLegend(item)"
                >
                  <span
                    class="legend-icon"
                    :style="{
                      color: item.itemStyle && item.itemStyle.color,
                      borderColor: item.itemStyle && item.itemStyle.color
                    }"
                  >
                    <img :src="item.icon" :alt="item.name">
                  </span>
                  <span class="legend-text">
                    <span class="value">{{ item.value }}</span>
                    <span class="title">{{ item.name }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <home-view-tabs
        :active="active"
        :collapsed="collapsed"
        @toggle-collapse="toggleCollapse"
      />
    </div>
  </section>
</template>

<script>
import HomeViewTabs from './HomeViewTabs.vue'
import DonutRingChart from './DonutRingChart.vue'
import alarmEmergencyIcon from '@/assets/images/home/alarm-emergency.png'
import alarmImportantIcon from '@/assets/images/home/alarm-important.png'
import alarmSecondaryIcon from '@/assets/images/home/alarm-secondary.png'
import alarmPromptIcon from '@/assets/images/home/alarm-prompt.png'

const ALARM_ICON_MAP = {
  紧急告警: alarmEmergencyIcon,
  重要告警: alarmImportantIcon,
  次要告警: alarmSecondaryIcon,
  提示告警: alarmPromptIcon
}

const COLLAPSE_STORAGE_KEY = 'ems-home-hero-collapsed'

export default {
  name: 'HomeHeroBand',
  components: { HomeViewTabs, DonutRingChart },
  props: {
    active: {
      type: String,
      required: true
    },
    metrics: {
      type: Array,
      default: () => []
    },
    statusSegments: {
      type: Array,
      default: () => []
    },
    alarmSegments: {
      type: Array,
      default: () => []
    },
    stationTotal: {
      type: [Number, String],
      default: 0
    },
    alarmTotal: {
      type: [Number, String],
      default: 0
    }
  },
  data() {
    return {
      collapsed: false
    }
  },
  computed: {
    alarmItems() {
      return (this.alarmSegments || []).map(item => ({
        ...item,
        icon: item.icon || ALARM_ICON_MAP[item.name]
      }))
    }
  },
  created() {
    try {
      this.collapsed = window.sessionStorage.getItem(COLLAPSE_STORAGE_KEY) === '1'
    } catch (e) {
      this.collapsed = false
    }
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed
      try {
        window.sessionStorage.setItem(COLLAPSE_STORAGE_KEY, this.collapsed ? '1' : '0')
      } catch (e) {}
    },
    handleSetting() {
      this.$emit('setting', this.$refs.kpiSettingTrigger)
    },
    goReportOverview() {
      this.$router.push({ path: '/ems-report/report' })
    },
    goStatusOverview() {
      this.$router.push({ path: '/ems-ops/status' })
    },
    goAlarmOverview() {
      this.$router.push({ path: '/ems-ops/alarm-current' })
    },
    handleStatusLegend(item) {
      this.$emit('status-legend', item)
    },
    handleAlarmLegend(item) {
      this.$emit('alarm-legend', item)
    }
  }
}
</script>

<style lang="scss">
.nco-home-container-toolbar {
  position: relative;
}

.nco-home-container-toolbar .nco-home-banner {
  position: relative;
  overflow: visible;
  background: url(~@/assets/images/list-bg.jpg) center center / cover no-repeat;
  background-size: cover;
  box-sizing: border-box;
}

.nco-home-container-toolbar .nco-home-banner.nco-home-banner-show {
  height: calc(33vh);
  transition: height 0.5s cubic-bezier(0, 1, 0, 1);
}

.nco-home-container-toolbar .nco-home-banner.nco-home-banner-hide {
  height: auto;
  min-height: 0;
  overflow: visible;
  background: transparent;
  transition: height 0.5s cubic-bezier(0, 1, 0, 1);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  box-sizing: border-box;
}

.nco-home-container-toolbar .nco-home-banner .nco-home-banner-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: calc(33vh);
  box-sizing: border-box;
  padding: 0;
}

.nco-home-container-toolbar .nco-home-banner .nco-home-kpi-card,
.nco-home-container-toolbar .nco-home-banner .nco-home-status-card,
.nco-home-container-toolbar .nco-home-banner .nco-home-alarm-card {
  width: 20%;
  height: 80%;
  position: relative;
  overflow: visible;
  min-width: 0;
}

/* —— 内层卡片 100% —— */
.nco-site-kpi-card,
.nco-site-status-card,
.nco-realtime-alarm-card {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  color: #fff;
  min-width: 0;
  min-height: 0;
}

/* —— 标题 —— */
.nco-site-kpi-card .nco-site-kpi-title {
  display: flex;
  justify-content: left;
  align-items: center;
  color: #fff;
  font-size: 1.25rem;
  font-family: Titillium-Regular, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  flex-shrink: 0;
  margin-bottom: 2.25rem;
}

.nco-site-kpi-card .nco-site-kpi-title .nco-site-kpi-titleWord {
  margin-right: 0.5rem;
}

.nco-site-kpi-card .nco-site-kpi-title .nco-firlter-params {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.72);
  font-size: 1.125rem;
}

.nco-site-kpi-card .nco-site-kpi-title .nco-firlter-params:hover {
  color: #fff;
}

.nco-site-kpi-card .nco-site-kpi-title .nco-site-kpi-more {
  color: #999;
  cursor: pointer;
  text-align: center;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 1.25rem;
  line-height: 1;
}

.nco-site-kpi-card .nco-site-kpi-title .nco-site-kpi-more:hover {
  color: #fff;
}

.nco-site-status-card .nco-site-status-title,
.nco-realtime-alarm-card .nco-realtime-alarm-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: 1.25rem;
  font-family: Titillium-Regular, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  flex-shrink: 0;
}

.nco-site-status-card .nco-site-status-title .nco-site-status-card-more,
.nco-realtime-alarm-card .nco-realtime-alarm-title .nco-realtime-alarm-card-more {
  flex-grow: 1;
  color: #999;
  cursor: pointer;
  text-align: center;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 1.25rem;
  line-height: 1;
}

.nco-site-status-card .nco-site-status-title .nco-site-status-card-more:hover,
.nco-realtime-alarm-card .nco-realtime-alarm-title .nco-realtime-alarm-card-more:hover {
  color: #fff;
}

@media screen and (max-width: 1441px) {
  .nco-site-kpi-card .nco-site-kpi-titleWord {
    font-size: 1.25rem !important;
  }

  .nco-site-kpi-card .nco-site-kpi-more {
    font-size: 1.25rem !important;
  }

  .nco-site-status-title span,
  .nco-realtime-alarm-title span {
    font-size: 1.25rem !important;
  }

  .nco-site-kpi-card .nco-site-kpi-card-optional ul li {
    margin-bottom: 0 !important;
  }
}

/* —— KPI 指标网格 —— */
.nco-site-kpi-card .nco-site-kpi-card-optional {
  /* 不要 height:100%，否则会盖住标题区，margin-top 无效 */
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul {
  position: relative;
  height: auto;
  min-height: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  width: 28rem;
  margin: 0;
  margin-bottom: 0;
  padding: 0;
  box-sizing: border-box;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li {
  width: 13.5rem;
  height: 4rem;
  list-style-type: none;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li:nth-child(even) {
  margin-left: 1rem;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value {
  display: flex;
  align-items: flex-start;
  color: #fff;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .counter-value-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  font-size: 50px !important;
  flex-shrink: 0;
  box-sizing: border-box;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .counter-value-icon img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  display: block;
  filter: brightness(0) invert(1);
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .counter-value-main {
  width: 11rem;
  height: 4rem;
  margin-left: 0.1rem;
  min-width: 0;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .counter-value-main-value {
  display: flex;
  align-items: baseline;
  height: 1.9rem;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .value {
  font-size: 1.3rem !important;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .unit-and-increase {
  margin-left: 0.5rem;
  font-size: 1rem;
  display: flex;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .unit-and-increase .unit {
  color: #999;
  font-size: 0.75rem;
}

.nco-site-kpi-card .nco-site-kpi-card-optional ul li .nco-kpi-counter-value .counter-value-main-title {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* —— 电站状态 —— */
.nco-site-status-card .nco-site-status-echarts-container {
  display: flex;
  width: 100%;
  height: 97%;
  margin-top: 1.8%;
  min-height: 0;
  flex: 1;
}

.nco-site-status-card .nco-site-status-echarts-container .nco-site-status-echarts {
  width: 60%;
  height: 100%;
  flex-shrink: 0;
}

.nco-site-status-card .nco-site-status-echarts-container .nco-site-status-echarts .chart {
  width: 100% !important;
  height: 100% !important;
}

.nco-site-status-card .nco-site-status-echarts-container .legend-container {
  padding: 2% 0 0 2%;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.nco-site-status-card .nco-site-status-echarts-container .legend-container .legend-item {
  display: flex;
  margin-bottom: 0.25rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #fff;
  text-align: left;
  align-items: flex-start;
}

.nco-site-status-card .nco-site-status-echarts-container .legend-container .legend-item .legend-icon.circle {
  border-radius: 50%;
  width: 0.875rem;
  height: 0.875rem;
  margin-top: 0.2rem;
  border: 2px solid #054585;
  box-sizing: border-box;
  flex-shrink: 0;
}

.nco-site-status-card .nco-site-status-echarts-container .legend-container .legend-item .legend-text {
  padding-left: 0.5rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nco-site-status-card .nco-site-status-echarts-container .legend-container .legend-item .legend-text .value {
  font-size: 1rem;
  line-height: 1.25rem;
  color: #fff;
  font-weight: 600;
}

.nco-site-status-card .nco-site-status-echarts-container .legend-container .legend-item .legend-text .title {
  font-size: 0.75rem;
  color: #999;
}

/* —— 当前告警 —— */
.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container {
  display: flex;
  width: 100%;
  height: 96%;
  margin-top: 1.8%;
  min-height: 0;
  flex: 1;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .nco-realtime-alarm-echarts {
  width: 60%;
  height: 100%;
  flex-shrink: 0;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .nco-realtime-alarm-echarts .chart {
  width: 100% !important;
  height: 100% !important;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container {
  padding: 2% 0 0 2%;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container .legend-item {
  display: flex;
  margin-bottom: 0.25rem;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #fff;
  text-align: left;
  align-items: flex-start;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container .legend-item .legend-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  font-size: 1.75rem;
  border: 1px solid currentColor;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.45);
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container .legend-item .legend-icon img {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
  display: block;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container .legend-item .legend-text {
  padding-left: 0.5rem;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container .legend-item .legend-text .value {
  font-size: 1rem;
  line-height: 1.25rem;
  color: #fff;
  font-weight: 600;
}

.nco-realtime-alarm-card .nco-realtime-alarm-echarts-container .legend-container .legend-item .legend-text .title {
  font-size: 0.75rem;
  color: #999;
}

.nco-home-container-toolbar .nco-home-container-switcher,
.nco-home-container-switcher {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 2rem;
  padding: 2px;
  position: absolute;
  top: 3.3vh;
  right: 1.5rem; /* 与下方 list-band margin 对齐 */
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  box-sizing: border-box;
}

.nco-home-container-toolbar .nco-home-container-switcher.new-menu,
.nco-home-container-switcher.new-menu {
  flex-direction: row;
  width: auto;
  /* block 级 flex + width:auto 会撑满父级；inline-flex 才收缩成小胶囊 */
  display: inline-flex;
  justify-content: flex-start;
}

.nco-home-container-switcher.new-menu > div {
  width: 1.75rem;
}

.nco-home-container-switcher > div {
  width: 100%;
  height: calc(2rem - 4px);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1px 0;
  cursor: pointer;
  box-sizing: border-box;
}

.nco-home-container-switcher > div:hover {
  color: rgba(255, 255, 255, 0.9);
}

.nco-home-container-switcher .nco-home-container-switcher-active {
  background-color: #fff;
  border-radius: 0.375rem;
  color: #0a59f7;
}

.nco-home-container-switcher .nco-home-container-switcher-active:hover {
  color: #0a59f7;
}

.nco-home-container-switcher .nco-switcher-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  font-size: 1rem;
  color: inherit;
  line-height: 0;
}

.nco-home-container-switcher .nco-switcher-icon--collapse {
  font-size: 1.6rem;
}

.nco-home-container-switcher .nco-switcher-icon svg {
  width: 1em;
  height: 1em;
  display: block;
  fill: currentColor;
}

/* 收起后 / 浅色底（对齐 energy-orb 浅色 switcher） */
.nco-home-container-switcher.is-light {
  background-color: rgba(17, 26, 44, 0.05);
  color: #777777;
  border-radius: 8px;
}

.nco-home-container-switcher.is-light > div:hover {
  color: #555;
}

.nco-home-container-switcher.is-light .nco-home-container-switcher-active {
  background-color: #fff;
  color: #0a59f7;
}

.nco-home-container-toolbar .nco-home-banner-hide .nco-home-container-switcher {
  position: relative;
  top: auto;
  right: auto;
  margin: 0;
  width: auto;
  display: inline-flex;
  flex-shrink: 0;
}

@media (max-width: 1366px) {
  .nco-home-container-toolbar .nco-home-banner .nco-home-kpi-card {
    width: 28%;
  }
}

@media (max-width: 992px) {
  .nco-home-container-toolbar .nco-home-banner.nco-home-banner-show,
  .nco-home-container-toolbar .nco-home-banner .nco-home-banner-card {
    height: auto;
  }

  .nco-home-container-toolbar .nco-home-banner .nco-home-banner-card {
    flex-direction: column;
    padding: 1.5rem 1.25rem;
    gap: 1rem;
  }

  .nco-home-container-toolbar .nco-home-banner .nco-home-kpi-card,
  .nco-home-container-toolbar .nco-home-banner .nco-home-status-card,
  .nco-home-container-toolbar .nco-home-banner .nco-home-alarm-card {
    width: 100%;
    height: auto;
    min-height: 12rem;
  }

  .nco-site-kpi-card .nco-site-kpi-card-optional ul {
    width: 100%;
    max-width: 28rem;
  }

  .nco-site-status-card .nco-site-status-echarts-container,
  .nco-realtime-alarm-card .nco-realtime-alarm-echarts-container {
    min-height: 10rem;
  }
}
</style>
