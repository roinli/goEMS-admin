<template>
  <div class="app-container monitor-overview">
    <div class="monitor-layout" :class="{ 'is-tree-collapsed': treeCollapsed }">
      <aside class="monitor-tree-panel">
        <div class="monitor-tree-panel__search-wrap">
          <div class="dpdesign-input-wrapper">
            <el-input
              v-model="treeFilter"
              size="small"
              clearable
              placeholder="搜索公司/电站/设备"
              class="dpdesign-input-wrapper__input"
            />
            <span class="dpdesign-input-wrapper__divider" />
            <span class="dpdesign-input-wrapper__search" title="搜索">
              <img :src="treeSearchImg" alt="" class="dpdesign-input-wrapper__search-icon">
            </span>
          </div>
        </div>
        <div class="monitor-tree-panel__tree-wrap">
          <el-tree
            ref="tree"
            :props="treeProps"
            :load="loadTreeNode"
            lazy
            node-key="key"
            highlight-current
            :current-node-key="treeCurrentKey"
            :default-expanded-keys="treeDefaultExpandedKeys"
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            class="monitor-tree"
            @node-click="handleNodeClick"
          >
            <span slot-scope="{ data }" class="monitor-tree__node" :class="'is-' + (data.level || 'device')">
              <img
                v-if="nodeImg(data)"
                class="monitor-tree__icon-img"
                :src="nodeImg(data)"
                alt=""
              >
              <i v-else :class="['monitor-tree__icon', nodeIcon(data)]" />
              <span class="monitor-tree__label" :title="data.label">{{ data.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <div
        class="tree-toggle-hide"
        :class="{ 'is-collapsed': treeCollapsed }"
        :title="treeCollapsed ? '展开' : '收起'"
        @click="toggleTreePanel"
      >
        <img
          class="tree-toggle-hide__icon"
          :src="treeCollapsed ? treeExpandImg : treeCollapseImg"
          alt=""
        >
      </div>

      <section v-loading="loading" class="monitor-content">
        <div class="nco-monitor-station-header nco-monitor-station-header-new">
          <div class="nco-monitor-station-header-title">
            <div class="left">
              <div class="nco-monitor-header-name-container">
                <span class="header-status-badge" :title="headerStatusText">
                  <span class="header-status-avatar">
                    <img :src="headerIcon" class="budge_img" alt="">
                  </span>
                  <sup class="header-status-dot" />
                </span>
                <div class="header-title-text" :title="headerTitle">{{ headerTitle }}</div>
              </div>
            </div>
            <div v-if="weatherDays.length" class="right">
              <div class="temperature-area">
                <div
                  v-for="(day, index) in weatherDays"
                  :key="day.date"
                  class="temperature-area-content"
                  :class="{ 'after-line': index < weatherDays.length - 1 }"
                >
                  <div class="weather-condition">
                    <div class="weather-condition-img">
                      <img class="weather-condition-img" :src="day.icon" alt="">
                    </div>
                    <p class="weather-condition-content">{{ index === 0 ? day.text : day.week }}</p>
                  </div>
                  <div v-if="index === 0" class="weather-temperature">
                    <div class="weather-temperature-range">
                      <span class="weather-temperature-content">{{ day.min }}<span class="separator">~</span>{{ day.max }}</span>
                      <span>&nbsp;</span>
                      <span class="weather-temperature-unit">°C</span>
                    </div>
                    <div class="weather-time">
                      <span class="weather-week">{{ day.week }}</span>
                      <span>&nbsp;&nbsp;</span>
                      <span class="weather-date">{{ day.date }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="nco-monitor-station-container page-wrapper nco-monitor-station-container-new">
          <div v-if="level !== 'device'" class="tab-wrapper flex-wrapper light-tab-wrapper">
            <span
              v-for="tab in contentTabs"
              :key="tab.key"
              :title="tab.label"
              class="monitor-tab"
              :class="{ selected: contentTab === tab.key }"
              @click="switchContentTab(tab.key)"
            >
              <a href="javascript:;">{{ tab.label }}</a>
            </span>
          </div>

          <div class="monitor-tab-body">
            <template v-if="contentTab === 'overview'">
        <!-- 全部 / 公司 聚合视图 -->
        <template v-if="level === 'all' || level === 'company'">
          <div
            v-loading="loading"
            class="nco-monitor-station-header-card-wrapper flex-wrapper"
          >
            <div
              v-for="item in companyMetricCards"
              :key="item.key"
              class="nco-monitor-station-header-card"
            >
              <img class="nco-monitor-station-header-card__icon" :src="item.icon" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(item.value, item.unit) }}</span>
                  <span class="nco-monitor-station-header-card__unit">{{ item.unit }}</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">{{ item.label }}</span>
                  <el-tooltip
                    v-if="item.tip"
                    :content="item.tip"
                    placement="top"
                    effect="light"
                    popper-class="ems-list-tooltip"
                  >
                    <span class="nco-monitor-station-header-card__tip">
                      <svg
                        class="nco-monitor-station-header-card__tip-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          fill="currentColor"
                          fill-rule="evenodd"
                          d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z"
                        />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
          <div class="company-charts-row">
            <div class="company-charts-row__trend">
              <chart-container title="功率与发电趋势" subtitle="最近24小时" :loading="loading" :empty="!chartReady" height="340px">
                <line-chart
                  v-if="chartReady"
                  variant="report"
                  :chart-data="lineChartData"
                  :x-axis-data="lineChartData.xAxisData || []"
                  :series-names="powerTrendSeriesNames"
                  height="310px"
                />
              </chart-container>
            </div>
            <div class="company-charts-row__status">
              <chart-container
                title="设备状态分布"
                subtitle="当前范围"
                :loading="loading"
                :empty="false"
                height="340px"
              >
                <device-status-dist
                  :segments="pieChartData.seriesData"
                  height="310px"
                />
              </chart-container>
            </div>
          </div>
        </template>

        <!-- 电站视图 -->
        <template v-else-if="level === 'station'">
          <div
            v-loading="loading"
            class="nco-monitor-station-header-card-wrapper flex-wrapper"
          >
            <div class="nco-monitor-station-header-card">
              <img class="nco-monitor-station-header-card__icon" :src="icDailyEnergy" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(selectedStation.todayGeneration, 'kWh') }}</span>
                  <span class="nco-monitor-station-header-card__unit">kWh</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">今日发电</span>
                  <el-tooltip content="当日累计" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <span class="nco-monitor-station-header-card__tip">
                      <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="nco-monitor-station-header-card">
              <img class="nco-monitor-station-header-card__icon" :src="icCumulativeEnergy" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(summary.todayRevenue, '元') }}</span>
                  <span class="nco-monitor-station-header-card__unit">元</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">今日收益</span>
                  <el-tooltip content="按电价规则测算" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <span class="nco-monitor-station-header-card__tip">
                      <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="nco-monitor-station-header-card">
              <img class="nco-monitor-station-header-card__icon" :src="icCumulativeEnergy" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(selectedStation.deviceCount, '台') }}</span>
                  <span class="nco-monitor-station-header-card__unit">台</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">设备数量</span>
                  <el-tooltip content="当前电站" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <span class="nco-monitor-station-header-card__tip">
                      <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="nco-monitor-station-header-card">
              <img class="nco-monitor-station-header-card__icon" :src="icDailySelfUseEnergy" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(summary.onlineDeviceCount, '台') }}</span>
                  <span class="nco-monitor-station-header-card__unit">台</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">在线设备</span>
                  <el-tooltip content="设备在线统计" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <span class="nco-monitor-station-header-card__tip">
                      <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="nco-monitor-station-header-card">
              <img class="nco-monitor-station-header-card__icon" :src="icDailyUseEnergy" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(selectedStation.alarmCount, '条') }}</span>
                  <span class="nco-monitor-station-header-card__unit">条</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">活动告警</span>
                  <el-tooltip content="当前未恢复" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <span class="nco-monitor-station-header-card__tip">
                      <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div class="nco-monitor-station-header-card">
              <img class="nco-monitor-station-header-card__icon" :src="icDailyEnergy" alt="">
              <div class="nco-monitor-station-header-card__body">
                <div class="nco-monitor-station-header-card__value-row">
                  <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(selectedStation.stringCapacityKw, 'kW') }}</span>
                  <span class="nco-monitor-station-header-card__unit">kW</span>
                </div>
                <div class="nco-monitor-station-header-card__label-row">
                  <span class="nco-monitor-station-header-card__label">组串容量</span>
                  <el-tooltip content="当前电站" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <span class="nco-monitor-station-header-card__tip">
                      <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                      </svg>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
          <div class="station-detail-row">
            <div class="station-detail-row__panel station-detail-row__panel--energy">
              <energy-flow-diagram
                :nodes="energyFlow.nodes || []"
                :edges="energyFlow.edges || []"
                :station-id="current.stationId"
                :company-id="current.companyId"
                @live-change="handleEnergyFlowLiveChange"
              />
            </div>
            <div class="station-detail-row__panel station-detail-row__panel--social">
              <div class="nco-monitor-social-contribution">
                <div
                  v-for="item in socialContributionItems"
                  :key="item.key"
                  class="nco-monitor-social-contribution__item"
                >
                  <img class="nco-monitor-social-contribution__icon" :src="item.icon" alt="">
                  <div class="nco-monitor-social-contribution__body">
                    <div class="nco-monitor-social-contribution__value-row">
                      <span class="nco-monitor-social-contribution__value">{{ item.value }}</span>
                      <span class="nco-monitor-social-contribution__unit">{{ item.unit }}</span>
                    </div>
                    <div class="nco-monitor-social-contribution__label">{{ item.label }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="station-detail-row__panel station-detail-row__panel--info">
              <div class="station-info-item"><span>电站名称</span><b>{{ valueOf(selectedStation.stationName) }}</b></div>
              <div class="station-info-item"><span>所属公司</span><b>{{ valueOf(selectedStation.companyName) }}</b></div>
              <div class="station-info-item"><span>最新数据时间</span><b>{{ valueOf(selectedStation.latestDataTime) }}</b></div>
              <div class="station-info-item">
                <span>收益状态</span>
                <el-tooltip :content="revenueStatusTip(selectedStation)" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <b>{{ revenueStatusText(selectedStation.revenueStatus) }}</b>
                </el-tooltip>
              </div>
              <div class="station-info-item"><span>收益说明</span><b>{{ valueOf(selectedStation.revenueMessage) }}</b></div>
              <div class="station-info-item"><span>同步状态</span><b>{{ syncStatusText(selectedStation.syncStatus) }}</b></div>
              <div class="station-info-item"><span>同步说明</span><b>{{ valueOf(selectedStation.syncMessage) }}</b></div>
              <div class="station-info-item"><span>组串容量</span><b>{{ formatNumber(selectedStation.stringCapacityKw, 2, '0.00') }} kW</b></div>
            </div>
          </div>
          <div class="station-charts-row">
            <chart-container title="功率与发电趋势" subtitle="最近24小时" :loading="loading" :empty="!chartReady" height="360px">
              <line-chart
                v-if="chartReady"
                variant="report"
                :chart-data="lineChartData"
                :x-axis-data="lineChartData.xAxisData || []"
                :series-names="powerTrendSeriesNames"
                height="330px"
              />
            </chart-container>
          </div>
        </template>

        <!-- 设备详情 / 历史 -->
        <template v-else-if="level === 'device'">
          <div class="hw-device-detail">
          <el-tabs v-model="deviceTab" class="hw-device-detail__tabs" @tab-click="handleDeviceTab">
            <el-tab-pane label="详细信息" name="detail">
              <!-- 储能设备详情 -->
              <div v-if="isEssDevice" class="hw-device-detail__body" v-loading="deviceLoading">
                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">基础信息</h3>
                  <div class="hw-basic-info">
                    <div
                      v-for="(row, index) in storageIdentityRows"
                      :key="'sid' + index"
                      class="hw-basic-info__cell"
                    >
                      <div class="hw-basic-info__label">
                        <span class="hw-circle" />
                        <span>{{ row.label }}</span>
                      </div>
                      <div class="hw-basic-info__value" :title="rowValueText(row)">{{ rowValueText(row) }}</div>
                    </div>
                  </div>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">储能单元</h3>
                  <div v-if="storageUnits.length" class="hw-basic-info">
                    <div
                      v-for="(unit, index) in storageUnits"
                      :key="'su' + index"
                      class="hw-basic-info__cell"
                    >
                      <div class="hw-basic-info__label">
                        <span class="hw-circle" />
                        <span>{{ unit.name || ('储能单元' + (index + 1)) }}</span>
                      </div>
                      <div class="hw-basic-info__value">荷电状态 {{ formatNumber(unit.soc) }}% · {{ formatNumber(unit.power) }} kW</div>
                    </div>
                  </div>
                  <el-empty v-else :image-size="60" description="暂无储能单元数据" />
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">设备实时数据</h3>
                  <div v-if="storageRealtimeRows.length" class="storage-grid">
                    <div v-for="(row, index) in storageRealtimeRows" :key="'srt' + index" class="storage-grid__item">
                      <div class="storage-grid__value">{{ rowValueText(row) }}</div>
                      <div class="storage-grid__label">{{ metricText(row.label) }}</div>
                    </div>
                  </div>
                  <el-empty v-else :image-size="60" description="暂无实时数据" />
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">待检测</h3>
                  <div class="hw-basic-info">
                    <div
                      v-for="(row, index) in storageHealthRows"
                      :key="'sh' + index"
                      class="hw-basic-info__cell"
                    >
                      <div class="hw-basic-info__label">
                        <span class="hw-circle" />
                        <span>{{ row.label }}</span>
                      </div>
                      <div class="hw-basic-info__value" :title="rowValueText(row)">{{ rowValueText(row) }}</div>
                    </div>
                  </div>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">历史数据</h3>
                  <chart-container title="" subtitle="荷电状态 / 充放电功率" :loading="deviceLoading" :empty="!deviceChartReady" height="300px">
                    <line-chart v-if="deviceChartReady" :chart-data="deviceChartData" height="270px" />
                  </chart-container>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">电池包</h3>
                  <el-table :data="batteryPacks" size="mini" class="hw-device-table" empty-text="暂无电池包数据">
                    <el-table-column label="状态" prop="status" width="90">
                      <template slot-scope="scope">
                        <span>{{ statusText(scope.row.status) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="名称" prop="name" min-width="120" />
                    <el-table-column label="序列号" prop="sn" min-width="140" />
                    <el-table-column label="充放电功率(kW)" width="140">
                      <template slot-scope="scope">
                        <span>{{ formatNumber(scope.row.power) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="电压(V)" width="100">
                      <template slot-scope="scope">
                        <span>{{ formatNumber(scope.row.voltage) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="最大温度(℃)" width="110">
                      <template slot-scope="scope">
                        <span>{{ formatNumber(scope.row.maxTemp) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="最小温度(℃)" width="110">
                      <template slot-scope="scope">
                        <span>{{ formatNumber(scope.row.minTemp) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="累计放电量(度)" width="130">
                      <template slot-scope="scope">
                        <span>{{ formatNumber(scope.row.totalDischarge) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="固件版本" prop="firmware" min-width="140" />
                    <el-table-column label="荷电状态(%)" width="110">
                      <template slot-scope="scope">
                        <span>{{ formatNumber(scope.row.soc) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>

              <!-- 通用设备详情 -->
              <div v-else class="hw-device-detail__body" v-loading="deviceLoading">
                <div class="nco-monitor-station-header-card-wrapper flex-wrapper hw-device-detail__metrics">
                  <div class="nco-monitor-station-header-card">
                    <img class="nco-monitor-station-header-card__icon" :src="icDailyEnergy" alt="">
                    <div class="nco-monitor-station-header-card__body">
                      <div class="nco-monitor-station-header-card__value-row">
                        <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(deviceDetail.activePower, 'kW') }}</span>
                        <span class="nco-monitor-station-header-card__unit">kW</span>
                      </div>
                      <div class="nco-monitor-station-header-card__label-row">
                        <span class="nco-monitor-station-header-card__label">实时功率</span>
                        <el-tooltip content="当前实时功率" placement="top" effect="light" popper-class="ems-list-tooltip">
                          <span class="nco-monitor-station-header-card__tip">
                            <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                            </svg>
                          </span>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>
                  <div class="nco-monitor-station-header-card">
                    <img class="nco-monitor-station-header-card__icon" :src="icCumulativeEnergy" alt="">
                    <div class="nco-monitor-station-header-card__body">
                      <div class="nco-monitor-station-header-card__value-row">
                        <span class="nco-monitor-station-header-card__value">{{ formatMetricValue(deviceDetail.todayGeneration, 'kWh') }}</span>
                        <span class="nco-monitor-station-header-card__unit">kWh</span>
                      </div>
                      <div class="nco-monitor-station-header-card__label-row">
                        <span class="nco-monitor-station-header-card__label">今日发电</span>
                        <el-tooltip content="当日累计" placement="top" effect="light" popper-class="ems-list-tooltip">
                          <span class="nco-monitor-station-header-card__tip">
                            <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                            </svg>
                          </span>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>
                  <div class="nco-monitor-station-header-card">
                    <img class="nco-monitor-station-header-card__icon" :src="icDailySelfUseEnergy" alt="">
                    <div class="nco-monitor-station-header-card__body">
                      <div class="nco-monitor-station-header-card__value-row">
                        <span class="nco-monitor-station-header-card__value">{{ commStatusText(deviceDetail.commStatus) }}</span>
                      </div>
                      <div class="nco-monitor-station-header-card__label-row">
                        <span class="nco-monitor-station-header-card__label">通讯状态</span>
                        <el-tooltip content="最近采样" placement="top" effect="light" popper-class="ems-list-tooltip">
                          <span class="nco-monitor-station-header-card__tip">
                            <svg class="nco-monitor-station-header-card__tip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path fill="currentColor" fill-rule="evenodd" d="M22 12C22 10.09 21.29 8.31 21.29 8.31C20.53 6.39 19.07 4.92 19.07 4.92C17.6 3.46 15.68 2.7 15.68 2.7C13.9 2 12 2 12 2C10.09 2 8.31 2.7 8.31 2.7C6.39 3.46 4.92 4.92 4.92 4.92C3.46 6.39 2.7 8.31 2.7 8.31C2 10.09 2 12 2 12C2 13.9 2.7 15.68 2.7 15.68C3.46 17.6 4.92 19.07 4.92 19.07C6.39 20.53 8.31 21.29 8.31 21.29C10.09 22 12 22 12 22C13.9 22 15.68 21.29 15.68 21.29C17.6 20.53 19.07 19.07 19.07 19.07C20.53 17.6 21.29 15.68 21.29 15.68C22 13.9 22 12 22 12ZM20.5 12C20.5 13.62 19.9 15.12 19.9 15.12C19.25 16.76 18.01 18.01 18.01 18.01C16.76 19.25 15.12 19.9 15.12 19.9C13.62 20.5 12 20.5 12 20.5C10.37 20.5 8.87 19.9 8.87 19.9C7.23 19.25 5.98 18.01 5.98 18.01C4.74 16.76 4.09 15.12 4.09 15.12C3.5 13.62 3.5 12 3.5 12C3.5 10.37 4.09 8.87 4.09 8.87C4.74 7.23 5.98 5.98 5.98 5.98C7.23 4.74 8.87 4.09 8.87 4.09C10.37 3.5 12 3.5 12 3.5C13.62 3.5 15.12 4.09 15.12 4.09C16.76 4.74 18.01 5.98 18.01 5.98C19.25 7.23 19.9 8.87 19.9 8.87C20.5 10.37 20.5 12 20.5 12ZM11.38 9.9L12.21 9.9C12.63 9.9 12.96 10.23 12.96 10.65L12.96 15.73L13.67 15.73C14.08 15.73 14.42 16.07 14.42 16.48C14.42 16.9 14.08 17.23 13.67 17.23L12.21 17.23L12.21 17.23L12.21 17.23L10.75 17.23C10.34 17.23 10 16.9 10 16.48C10 16.07 10.34 15.73 10.75 15.73L11.46 15.73L11.46 11.4L11.38 11.4C10.96 11.4 10.63 11.06 10.63 10.65C10.63 10.23 10.96 9.9 11.38 9.9ZM13 7.76C13 7.21 12.55 6.76 12 6.76C11.44 6.76 11 7.21 11 7.76C11 8.31 11.44 8.76 12 8.76C12.55 8.76 13 8.31 13 7.76Z" />
                            </svg>
                          </span>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">基础信息</h3>
                  <div class="hw-basic-info">
                    <div
                      v-for="(row, index) in deviceIdentityRows"
                      :key="'id' + index"
                      class="hw-basic-info__cell"
                    >
                      <div class="hw-basic-info__label">
                        <span class="hw-circle" />
                        <span>{{ row.label }}</span>
                      </div>
                      <div class="hw-basic-info__value" :title="rowValueText(row)">{{ rowValueText(row) }}</div>
                    </div>
                  </div>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">资产信息</h3>
                  <div class="hw-basic-info">
                    <div
                      v-for="(row, index) in deviceAssetRows"
                      :key="'as' + index"
                      class="hw-basic-info__cell"
                    >
                      <div class="hw-basic-info__label">
                        <span class="hw-circle" />
                        <span>{{ row.label }}</span>
                      </div>
                      <div class="hw-basic-info__value" :title="rowValueText(row)">{{ rowValueText(row) }}</div>
                    </div>
                  </div>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">运行指标</h3>
                  <el-table :data="deviceMetricRows" size="mini" class="hw-device-table">
                    <el-table-column label="指标" prop="label" min-width="200">
                      <template slot-scope="scope">
                        <span>{{ metricText(scope.row.label) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="值" prop="value" min-width="220">
                      <template slot-scope="scope">
                        <span>{{ rowValueText(scope.row) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="说明" prop="remark" min-width="320" />
                  </el-table>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">设备状态</h3>
                  <el-table :data="deviceStatusRows" size="mini" class="hw-device-table">
                    <el-table-column label="指标" prop="label" min-width="200" />
                    <el-table-column label="值" prop="value" min-width="180">
                      <template slot-scope="scope">
                        <span>{{ rowValueText(scope.row) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="说明" prop="remark" min-width="320" />
                  </el-table>
                </div>

                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">实时趋势</h3>
                  <chart-container title="" subtitle="最近24小时" :loading="deviceLoading" :empty="!deviceChartReady" height="300px">
                    <line-chart
                      v-if="deviceChartReady"
                      variant="report"
                      :chart-data="deviceChartData"
                      :series-names="deviceTrendSeriesNames"
                      height="270px"
                    />
                  </chart-container>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="历史信息" name="history">
              <div class="hw-device-detail__body">
                <el-form
                  :inline="true"
                  size="small"
                  label-width="90px"
                  class="ems-list-search"
                  @submit.native.prevent
                >
                  <el-form-item label="查询时间">
                    <el-date-picker
                      v-model="historyRange"
                      class="ems-list-search__daterange"
                      type="datetimerange"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      value-format="yyyy-MM-dd HH:mm:ss"
                      :default-time="['00:00:00', '23:59:59']"
                      :picker-options="historyPickerOptions"
                    />
                  </el-form-item>
                  <el-form-item label="信号点名称">
                    <el-input :value="historySignalLabel" disabled class="ems-list-search__control" />
                  </el-form-item>
                  <el-form-item class="ems-list-search__actions">
                    <el-button type="primary" @click="loadDeviceHistory">查询</el-button>
                    <el-button @click="resetDeviceHistory">重置</el-button>
                  </el-form-item>
                </el-form>
                <div class="hw-device-history-divider" role="separator" />
                <div class="hw-device-detail__section">
                  <h3 class="hw-part-title">历史趋势</h3>
                  <chart-container class="history-trend-chart" :loading="historyLoading" :empty="!historyChartReady" height="380px">
                    <line-chart
                      v-if="historyChartReady"
                      variant="history"
                      :chart-data="historyChartData"
                      :series-names="[historySignalLabel]"
                      :y-axis-name="historyYAxisName"
                      height="360px"
                    />
                  </chart-container>
                </div>
                <div class="hw-device-detail__section" v-loading="historyLoading">
                  <h3 class="hw-part-title">采样明细</h3>
                  <el-table :data="pagedHistoryRows" size="mini" class="hw-device-table ems-list-table" height="300">
                    <template slot="empty">
                      <div class="ems-list-table__empty">
                        <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                        <p class="ems-list-table__empty-text">暂无数据</p>
                      </div>
                    </template>
                    <el-table-column label="时间" prop="time" width="180" />
                    <el-table-column label="设备" prop="deviceName" min-width="140" />
                    <el-table-column label="指标" prop="metricKey" min-width="150">
                      <template slot-scope="scope">
                        <span>{{ metricText(scope.row.metricKey) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="值" prop="value" width="120" />
                    <el-table-column label="单位" prop="unit" width="90">
                      <template slot-scope="scope">
                        <span>{{ unitText(scope.row.unit) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="质量" prop="quality" width="100">
                      <template slot-scope="scope">
                        <span>{{ qualityText(scope.row.quality) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div v-if="historyTotal > 0" class="hw-device-history-footer">
                    <pagination
                      :total="historyTotal"
                      :page.sync="historyQuery.pageNum"
                      :limit.sync="historyQuery.pageSize"
                      :auto-scroll="false"
                    />
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
          </div>
        </template>
            </template>
            <div v-else-if="contentTab === 'stationView' && level === 'station'" class="monitor-station-view-pane">
              <div class="monitor-station-view-switch">
                <div class="monitor-station-view-switch__tabs">
                  <span
                    v-for="item in stationViewModes"
                    :key="item.key"
                    class="monitor-subtab"
                    :class="{ selected: stationViewMode === item.key }"
                    @click="stationViewMode = item.key"
                  >{{ item.label }}</span>
                </div>
                <div class="monitor-station-view-body">
                  <station-view-page
                    v-if="stationViewMode === 'station'"
                    :key="'station-' + current.stationId"
                    embedded
                    :company-id="current.companyId"
                    :station-id="current.stationId"
                  />
                  <logic-view-page
                    v-else
                    :key="'logic-' + current.stationId"
                    embedded
                    :company-id="current.companyId"
                    :station-id="current.stationId"
                  />
                </div>
              </div>
            </div>
            <div v-else-if="contentTab === 'stationRank' && (level === 'all' || level === 'company')" class="table-shell monitor-station-rank">
              <div class="table-shell__wrap">
                <el-table
                  v-loading="loading"
                  :data="pagedStationRows"
                  class="ems-list-table"
                  @row-dblclick="drillToStation"
                >
                  <template slot="empty">
                    <div class="ems-list-table__empty">
                      <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                      <p class="ems-list-table__empty-text">暂无数据</p>
                    </div>
                  </template>
                  <el-table-column type="index" label="序号" width="60" align="center" :index="stationRankIndex" />
                  <el-table-column label="电站名称" prop="stationName" min-width="160" :show-overflow-tooltip="true" />
                  <el-table-column label="今日发电(kWh)" prop="todayGeneration" width="140" align="right">
                    <template slot-scope="scope">
                      <span>{{ formatNumber(scope.row.todayGeneration) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="收益(元)" prop="todayRevenue" width="120" align="right">
                    <template slot-scope="scope">
                      <span>{{ formatNumber(scope.row.todayRevenue) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="收益状态" prop="revenueStatus" width="110" :show-overflow-tooltip="true">
                    <template slot-scope="scope">
                      <el-tooltip :content="revenueStatusTip(scope.row)" placement="top" effect="light" popper-class="ems-list-tooltip">
                        <span>{{ revenueStatusText(scope.row.revenueStatus) }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="同步状态" prop="syncStatus" width="110" :show-overflow-tooltip="true">
                    <template slot-scope="scope">
                      <span>{{ syncStatusText(scope.row.syncStatus) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" prop="status" width="90" align="center">
                    <template slot-scope="scope">
                      <span>{{ stationStatusText(scope.row.status) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="操作"
                    align="center"
                    width="100"
                    fixed="right"
                    class-name="small-padding fixed-width ems-list-table__ops"
                  >
                    <template slot-scope="scope">
                      <el-tooltip content="查看监控" placement="top" effect="light" popper-class="ems-list-tooltip">
                        <el-button
                          type="text"
                          icon="el-icon-bottom-right"
                          class="ems-list-table__ops-btn"
                          @click="drillToStation(scope.row)"
                        />
                      </el-tooltip>
                      <el-tooltip content="告警" placement="top" effect="light" popper-class="ems-list-tooltip">
                        <el-button
                          type="text"
                          icon="el-icon-warning-outline"
                          class="ems-list-table__ops-btn"
                          @click="goStationAlarm(scope.row)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="table-footer">
                <pagination
                  v-show="stationRankTotal > 0"
                  :total="stationRankTotal"
                  :page.sync="stationRankQuery.pageNum"
                  :limit.sync="stationRankQuery.pageSize"
                  @pagination="handleStationRankPagination"
                />
              </div>
            </div>
            <div v-else-if="contentTab === 'deviceManage' && level === 'station'" class="table-shell monitor-station-rank">
              <div class="table-shell__wrap">
                <el-table
                  v-loading="loading"
                  :data="pagedStationDevices"
                  class="ems-list-table"
                  @row-dblclick="drillToDevice"
                >
                  <template slot="empty">
                    <div class="ems-list-table__empty">
                      <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                      <p class="ems-list-table__empty-text">暂无数据</p>
                    </div>
                  </template>
                  <el-table-column type="index" label="序号" width="60" align="center" :index="deviceManageIndex" />
                  <el-table-column label="设备名称" prop="deviceName" min-width="160" :show-overflow-tooltip="true" />
                  <el-table-column label="设备类型" prop="deviceType" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ deviceTypeText(scope.row.deviceType) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="通讯状态" prop="commStatus" width="120" align="center">
                    <template slot-scope="scope">
                      <span>{{ commStatusText(scope.row.commStatus) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="实时功率(kW)" prop="activePower" width="140" align="right">
                    <template slot-scope="scope">
                      <span>{{ formatNumber(scope.row.activePower) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="操作"
                    align="center"
                    width="100"
                    fixed="right"
                    class-name="small-padding fixed-width ems-list-table__ops"
                  >
                    <template slot-scope="scope">
                      <el-tooltip content="查看详情" placement="top" effect="light" popper-class="ems-list-tooltip">
                        <el-button
                          type="text"
                          icon="el-icon-view"
                          class="ems-list-table__ops-btn"
                          @click="drillToDevice(scope.row)"
                        />
                      </el-tooltip>
                      <el-tooltip content="告警" placement="top" effect="light" popper-class="ems-list-tooltip">
                        <el-button
                          type="text"
                          icon="el-icon-warning-outline"
                          class="ems-list-table__ops-btn"
                          @click="goDeviceAlarm(scope.row)"
                        />
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="table-footer">
                <pagination
                  v-show="deviceManageTotal > 0"
                  :total="deviceManageTotal"
                  :page.sync="deviceManageQuery.pageNum"
                  :limit.sync="deviceManageQuery.pageSize"
                  @pagination="handleDeviceManagePagination"
                />
              </div>
            </div>
            <div v-else class="monitor-tab-placeholder">内容待定</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { listCompany } from "@/api/ems/company";
import { listStation } from "@/api/ems/station";
import { listDevice } from "@/api/ems/device";
import { getMonitorOverview, getMonitorDeviceDetail, getMonitorHistory, getMonitorStorageDetail, getMonitorStorageHistory } from "@/api/ems/monitor";
import { getStationWeather } from "@/api/ems/weather";
import { ChartContainer } from "@/components/ems";
import LineChart from "@/views/dashboard/LineChart";
import DeviceStatusDist from "@/views/ems/monitor/DeviceStatusDist.vue";
import EnergyFlowDiagram from "@/views/ems/monitor/EnergyFlowDiagram.vue";
import StationViewPage from "@/views/ems/monitor/station-view.vue";
import LogicViewPage from "@/views/ems/monitor/logic-view.vue";
import { formatDisplayNumber, buildContributionCards } from "@/views/ems/home/shared/homeSupport";
import { normalizeWeather } from "@/views/ems/home/shared/weatherSupport";
import {
  commStatusText,
  deviceTypeText,
  metricText,
  qualityText,
  revenueStatusText,
  revenueStatusTip,
  rowValueText,
  stationStatusText,
  statusText,
  syncStatusText,
  unitText
} from "@/views/ems/monitor/shared/monitorFormat";
import { defaultHistoryRange, disabledHistoryDate, normalizeHistoryRange, validateHistoryRange } from "@/views/ems/monitor/shared/historyRange";
import treeStationImg from "@/assets/images/monitor/station.png";
import treeDeviceImg from "@/assets/images/monitor/device.png";
import treeCompanyImg from "@/assets/images/monitor/company.png";
import treeCollapseImg from "@/assets/images/monitor/shou.png";
import treeExpandImg from "@/assets/images/monitor/zhan.png";
import treeSearchImg from "@/assets/images/monitor/search.svg";
import headerHouseImg from "@/assets/images/monitor/house.svg";
import tableEmptyIcon from "@/assets/images/empty.svg";
import icCumulativeEnergy from "@/assets/images/monitor/ic_cumulative_energy.png";
import icDailyEnergy from "@/assets/images/monitor/ic_daily_energy.png";
import icDailySelfUseEnergy from "@/assets/images/monitor/ic_daily_self_use_energy.png";
import icDailyUseEnergy from "@/assets/images/monitor/ic_daily_use_energy.png";
import icDedicateCoal from "@/assets/images/monitor/ic_dedicate_coal_v2.png";
import icDedicateCo2 from "@/assets/images/monitor/ic_dedicate_CO2_v2.png";
import icDedicateTree from "@/assets/images/monitor/ic_dedicate_Tree_v2.png";

const CONTENT_TABS = [
  { key: "overview", label: "概览" },
  { key: "stationView", label: "电站视图" },
  { key: "deviceManage", label: "设备管理" }
];
const COMPANY_CONTENT_TABS = [
  { key: "overview", label: "概览" },
  { key: "stationRank", label: "电站排行" }
];

function getRows(response) {
  const data = (response && response.data) || response || {};
  if (Array.isArray(data)) {
    return data;
  }
  return data.rows || data.list || data.records || [];
}

export default {
  name: "EmsMonitorOverview",
  components: { ChartContainer, LineChart, DeviceStatusDist, EnergyFlowDiagram, StationViewPage, LogicViewPage },
  data() {
    const routeStationId = this.$route && this.$route.query && this.$route.query.stationId;
    const routeCompanyId = this.$route && this.$route.query && this.$route.query.companyId;
    const initialStation = routeStationId != null && routeStationId !== "";
    return {
      loading: false,
      treeFilter: "",
      treeCollapsed: false,
      treeStationImg,
      treeDeviceImg,
      treeCompanyImg,
      treeCollapseImg,
      treeExpandImg,
      treeSearchImg,
      headerHouseImg,
      tableEmptyIcon,
      icCumulativeEnergy,
      icDailyEnergy,
      icDailySelfUseEnergy,
      icDailyUseEnergy,
      icDedicateCoal,
      icDedicateCo2,
      icDedicateTree,
      contentTab: "overview",
      stationViewMode: "station",
      stationViewModes: [
        { key: "station", label: "物理视图" },
        { key: "logic", label: "逻辑视图" }
      ],
      treeProps: { label: "label", children: "children", isLeaf: "leaf" },
      treeCurrentKey: initialStation ? "station-" + routeStationId : "all",
      treeDefaultExpandedKeys: routeCompanyId ? ["all", "company-" + routeCompanyId] : ["all"],
      level: initialStation ? "station" : "all",
      current: initialStation
        ? { key: "station-" + routeStationId, label: "电站", level: "station", stationId: routeStationId, companyId: routeCompanyId }
        : { key: "all", label: "全部", level: "all" },
      breadcrumb: initialStation
        ? [{ key: "all", label: "全部", level: "all" }, { key: "station-" + routeStationId, label: "电站", level: "station" }]
        : [{ key: "all", label: "全部", level: "all" }],
      summary: this.emptySummary(),
      stationRows: [],
      stationRankQuery: {
        pageNum: 1,
        pageSize: 10
      },
      deviceManageQuery: {
        pageNum: 1,
        pageSize: 10
      },
      alarmRows: [],
      selectedStation: {},
      weatherData: null,
      weatherRequestSeq: 0,
      stationDevices: [],
      energyFlow: {},
      lineChartData: this.emptyChart(),
      chartReady: false,
      deviceTab: "detail",
      deviceLoading: false,
      deviceDetail: {},
      deviceIdentityRows: [],
      deviceAssetRows: [],
      deviceMetricRows: [],
      deviceStatusRows: [],
      deviceChartData: this.emptyChart(),
      deviceChartReady: false,
      storageRealtimeRows: [],
      storageHealthRows: [],
      storageIdentityRows: [],
      storageUnits: [],
      batteryPacks: [],
      historyRange: defaultHistoryRange(),
      historyPickerOptions: { disabledDate: disabledHistoryDate },
      historyLoading: false,
      historyRows: [],
      historyQuery: {
        pageNum: 1,
        pageSize: 10
      },
      historyChartData: this.emptyChart(),
      historyChartReady: false,
      refreshTimer: null
    };
  },
  computed: {
    contentTabs() {
      return this.level === "all" || this.level === "company" ? COMPANY_CONTENT_TABS : CONTENT_TABS;
    },
    companyMetricCards() {
      return [
        {
          key: "stationCount",
          label: "总电站",
          value: this.summary.stationCount,
          unit: "座",
          tip: "当前范围",
          icon: this.icCumulativeEnergy
        },
        {
          key: "todayRevenue",
          label: "今日收益",
          value: this.summary.todayRevenue,
          unit: "元",
          tip: "按电价规则测算",
          icon: this.icCumulativeEnergy
        },
        {
          key: "todayGeneration",
          label: "今日发电",
          value: this.summary.todayGeneration,
          unit: "kWh",
          tip: "当日累计",
          icon: this.icDailyEnergy
        },
        {
          key: "onlineDeviceCount",
          label: "在线设备",
          value: this.summary.onlineDeviceCount,
          unit: "台",
          tip: "设备在线统计",
          icon: this.icDailySelfUseEnergy
        },
        {
          key: "activeAlarmCount",
          label: "当前告警",
          value: this.summary.activeAlarmCount,
          unit: "条",
          tip: "当前未恢复",
          icon: this.icDailyUseEnergy
        },
        {
          key: "offlineDeviceCount",
          label: "离线设备",
          value: this.summary.offlineDeviceCount,
          unit: "台",
          tip: "通讯异常统计",
          icon: this.icDailyUseEnergy
        }
      ];
    },
    headerTitle() {
      if (this.level === "device") {
        const station = this.breadcrumb.find(item => item.level === "station");
        return (station && station.label) || this.current.label || "电站";
      }
      if (this.current && this.current.label) {
        return this.current.label;
      }
      return "全部";
    },
    headerIcon() {
      if (this.level === "company") {
        return this.treeCompanyImg;
      }
      return this.headerHouseImg;
    },
    headerStatusText() {
      return "正常";
    },
    weatherDays() {
      if (!this.current || !this.current.stationId || !this.weatherData) {
        return [];
      }
      return (this.weatherData.daily || []).slice(0, 3);
    },
    pieChartData() {
      return {
        legendData: ["在线设备", "离线设备", "活动告警"],
        seriesData: [
          { name: "在线设备", value: Number(this.summary.onlineDeviceCount || 0) },
          { name: "离线设备", value: Number(this.summary.offlineDeviceCount || 0) },
          { name: "活动告警", value: Number(this.summary.activeAlarmCount || 0) }
        ]
      };
    },
    powerTrendSeriesNames() {
      const names = this.lineChartData && this.lineChartData.seriesNames;
      if (Array.isArray(names) && names.length) {
        return names;
      }
      return ["功率(kW)", "发电量(kWh)"];
    },
    deviceTrendSeriesNames() {
      const names = this.deviceChartData && this.deviceChartData.seriesNames;
      if (Array.isArray(names) && names.length) {
        return names;
      }
      return ["发电量(kWh/5min)", "实时功率(kW)"];
    },
    stationRankTotal() {
      return Array.isArray(this.stationRows) ? this.stationRows.length : 0;
    },
    pagedStationRows() {
      const pageNum = Number(this.stationRankQuery.pageNum) || 1;
      const pageSize = Number(this.stationRankQuery.pageSize) || 10;
      const start = (pageNum - 1) * pageSize;
      return (this.stationRows || []).slice(start, start + pageSize);
    },
    deviceManageTotal() {
      return Array.isArray(this.stationDevices) ? this.stationDevices.length : 0;
    },
    pagedStationDevices() {
      const pageNum = Number(this.deviceManageQuery.pageNum) || 1;
      const pageSize = Number(this.deviceManageQuery.pageSize) || 10;
      const start = (pageNum - 1) * pageSize;
      return (this.stationDevices || []).slice(start, start + pageSize);
    },
    energyNodes() {
      return Array.isArray(this.energyFlow.nodes) ? this.energyFlow.nodes : [];
    },
    socialContributionItems() {
      const station = this.selectedStation || {};
      const direct = station.socialContribution || this.energyFlow.socialContribution || {};
      const cards = buildContributionCards([station], {
        standard_coal_factor: station.coalFactor,
        co2_factor: station.co2Factor,
        tree_factor: station.treeFactor
      });
      const cardMap = {};
      (cards || []).forEach(item => {
        if (item && item.key) {
          cardMap[item.key] = item;
        }
      });
      const pickValue = (keys, fallback, digits) => {
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const raw = direct[key] != null ? direct[key] : station[key];
          if (raw != null && raw !== "") {
            return formatDisplayNumber(raw, digits, "--");
          }
        }
        return fallback != null && fallback !== "" ? fallback : "--";
      };
      return [
        {
          key: "coal",
          label: "节约标准煤",
          unit: "吨",
          icon: this.icDedicateCoal,
          value: pickValue(
            ["savedCoalTons", "coalSavedTons", "standardCoal", "savedCoal", "coal"],
            cardMap.coal && cardMap.coal.value,
            2
          )
        },
        {
          key: "co2",
          label: "CO2减排量",
          unit: "吨",
          icon: this.icDedicateCo2,
          value: pickValue(
            ["co2ReductionTons", "co2SavedTons", "co2Reduction", "co2"],
            cardMap.co2 && cardMap.co2.value,
            2
          )
        },
        {
          key: "tree",
          label: "等效植树量",
          unit: "棵",
          icon: this.icDedicateTree,
          value: pickValue(
            ["equivalentTrees", "equivalentTreeCount", "treeCount", "trees"],
            cardMap.tree && cardMap.tree.value,
            0
          )
        }
      ];
    },
    isEssDevice() {
      return this.current && this.current.deviceType === "ESS";
    },
    historySignalLabel() {
      return this.isEssDevice ? "充放电功率" : "实时功率";
    },
    historyYAxisName() {
      const chartUnit = this.historyChartData && (this.historyChartData.unit || this.historyChartData.yAxisName);
      if (chartUnit) {
        return this.unitText(chartUnit);
      }
      const row = (this.historyRows && this.historyRows[0]) || {};
      const unit = this.unitText(row.unit);
      return unit && unit !== "--" ? unit : "kW";
    },
    historyTotal() {
      return Array.isArray(this.historyRows) ? this.historyRows.length : 0;
    },
    pagedHistoryRows() {
      const pageNum = Number(this.historyQuery.pageNum) || 1;
      const pageSize = Number(this.historyQuery.pageSize) || 10;
      const start = (pageNum - 1) * pageSize;
      return (this.historyRows || []).slice(start, start + pageSize);
    }
  },
  watch: {
    treeFilter(value) {
      this.$refs.tree.filter(value);
    }
  },
  created() {
    if (this.current.level === "station") {
      this.loadStation(this.current.stationId, this.current.companyId);
    } else {
      this.loadAggregate();
    }
  },
  mounted() {
    this.startRealtimeRefresh();
  },
  beforeDestroy() {
    this.stopRealtimeRefresh();
  },
  methods: {
    toggleTreePanel() {
      this.treeCollapsed = !this.treeCollapsed;
    },
    switchContentTab(key) {
      this.contentTab = key;
      if (key === "stationView") {
        this.stationViewMode = "station";
      }
    },
    handleEnergyFlowLiveChange(enabled) {
      if (enabled && this.level === "station" && this.current && this.current.stationId) {
        this.loadStation(this.current.stationId, this.current.companyId);
      }
    },
    stationRankIndex(index) {
      const pageNum = Number(this.stationRankQuery.pageNum) || 1;
      const pageSize = Number(this.stationRankQuery.pageSize) || 10;
      return (pageNum - 1) * pageSize + index + 1;
    },
    handleStationRankPagination() {
      // 前端分页，页码由 sync 更新
    },
    deviceManageIndex(index) {
      const pageNum = Number(this.deviceManageQuery.pageNum) || 1;
      const pageSize = Number(this.deviceManageQuery.pageSize) || 10;
      return (pageNum - 1) * pageSize + index + 1;
    },
    handleDeviceManagePagination() {
      // 前端分页，页码由 sync 更新
    },
    formatMetricValue(value, unit) {
      if (value === null || value === undefined || value === "") {
        return "--";
      }
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return String(value);
      }
      if (["座", "台", "条", "个"].indexOf(unit) !== -1) {
        return String(Math.round(number));
      }
      return formatDisplayNumber(number, 2, "--");
    },
    emptySummary() {
      return { stationCount: 0, onlineDeviceCount: 0, todayGeneration: 0, todayRevenue: 0, activeAlarmCount: 0, offlineDeviceCount: 0 };
    },
    emptyChart() {
      return { xAxisData: [], expectedData: [], actualData: [] };
    },
    hasTrendData(chart) {
      return !!(chart && ((chart.actualData && chart.actualData.length) || (chart.expectedData && chart.expectedData.length)));
    },
    nodeIcon(data) {
      if (data.level === "all") {
        return "el-icon-s-home";
      }
      if (data.level === "company") {
        return "el-icon-office-building";
      }
      if (data.level === "station") {
        return "el-icon-sunny";
      }
      return "el-icon-cpu";
    },
    nodeImg(data) {
      if (data.level === "company") return this.treeCompanyImg;
      if (data.level === "station") return this.treeStationImg;
      if (data.level === "device") return this.treeDeviceImg;
      return "";
    },
    filterNode(value, data) {
      if (!value) {
        return true;
      }
      return (data.label || "").indexOf(value) !== -1;
    },
    ensureDefaultTreeState() {
      this.$nextTick(() => {
        const tree = this.$refs.tree;
        if (!tree) {
          return;
        }
        tree.setCurrentKey(this.treeCurrentKey || "all");
        const allNode = tree.getNode("all");
        if (allNode && !allNode.expanded) {
          allNode.expand();
        }
      });
    },
    loadTreeNode(node, resolve) {
      if (node.level === 0) {
        resolve([{ key: "all", label: "全部", level: "all", leaf: false }]);
        this.ensureDefaultTreeState();
        return;
      }
      const data = node.data || {};
      if (data.level === "all") {
        Promise.all([
          listCompany({ pageNum: 1, pageSize: 9999 }),
          listStation({ pageNum: 1, pageSize: 9999 })
        ]).then(([companyRes, stationRes]) => {
          const companies = getRows(companyRes);
          const stations = getRows(stationRes);
          const companyHasStation = {};
          stations.forEach(item => {
            if (item.companyId != null) {
              companyHasStation[item.companyId] = true;
            }
          });
          if (!companies.length) {
            node.isLeaf = true;
          }
          resolve(companies.map(item => ({
            key: "company-" + item.companyId,
            label: item.companyName,
            level: "company",
            companyId: item.companyId,
            leaf: !companyHasStation[item.companyId]
          })));
          // 保持「全部」展开，公司列表直接可见
          this.$nextTick(() => {
            const tree = this.$refs.tree;
            if (!tree) {
              return;
            }
            tree.setCurrentKey("all");
            const allNode = tree.getNode("all");
            if (allNode && !allNode.expanded) {
              allNode.expand();
            }
          });
        }).catch(() => {
          node.isLeaf = true;
          resolve([]);
        });
        return;
      }
      if (data.level === "company") {
        Promise.all([
          listStation({ pageNum: 1, pageSize: 9999, companyId: data.companyId }),
          listDevice({ pageNum: 1, pageSize: 9999, companyId: data.companyId })
        ]).then(([stationRes, deviceRes]) => {
          const stations = getRows(stationRes);
          const devices = getRows(deviceRes);
          const stationHasDevice = {};
          devices.forEach(item => {
            if (item.stationId == null) {
              return;
            }
            if (data.companyId != null && item.companyId != null && String(item.companyId) !== String(data.companyId)) {
              return;
            }
            stationHasDevice[item.stationId] = true;
          });
          if (!stations.length) {
            node.isLeaf = true;
          }
          resolve(stations.map(item => ({
            key: "station-" + item.stationId,
            label: item.stationName,
            level: "station",
            stationId: item.stationId,
            companyId: item.companyId || data.companyId,
            leaf: !stationHasDevice[item.stationId]
          })));
        }).catch(() => {
          node.isLeaf = true;
          resolve([]);
        });
        return;
      }
      if (data.level === "station") {
        listDevice({ pageNum: 1, pageSize: 9999, stationId: data.stationId }).then(response => {
          const rows = getRows(response);
          if (!rows.length) {
            node.isLeaf = true;
          }
          resolve(rows.map(item => ({
            key: "device-" + item.deviceId,
            label: item.deviceName,
            level: "device",
            deviceId: item.deviceId,
            deviceType: item.deviceType,
            stationId: item.stationId || data.stationId,
            companyId: item.companyId || data.companyId,
            leaf: true
          })));
        }).catch(() => {
          node.isLeaf = true;
          resolve([]);
        });
        return;
      }
      node.isLeaf = true;
      resolve([]);
    },
    handleNodeClick(data, node) {
      this.current = data;
      this.level = data.level;
      this.treeCurrentKey = data.key;
      this.contentTab = "overview";
      this.breadcrumb = this.buildBreadcrumb(node);
      this.loadWeather(data.stationId);
      if (data.level === "all" || data.level === "company") {
        this.loadAggregate(data.companyId);
      } else if (data.level === "station") {
        this.loadStation(data.stationId, data.companyId);
      } else if (data.level === "device") {
        this.loadDevice(data);
      }
    },
    startRealtimeRefresh() {
      this.stopRealtimeRefresh();
      this.refreshTimer = setInterval(() => {
        this.refreshCurrentView();
      }, 60000);
    },
    stopRealtimeRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    refreshCurrentView() {
      if (this.loading || this.deviceLoading || this.historyLoading) {
        return;
      }
      const data = this.current || { level: "all" };
      if (data.level === "all" || data.level === "company") {
        this.loadAggregate(data.companyId);
      } else if (data.level === "station") {
        this.loadStation(data.stationId, data.companyId);
      } else if (data.level === "device") {
        this.loadDeviceDetail(data);
        if (this.deviceTab === "history") {
          this.loadDeviceHistory(true);
        }
      }
    },
    buildBreadcrumb(node) {
      const chain = [];
      let cursor = node;
      while (cursor && cursor.data && cursor.data.key) {
        chain.unshift({ key: cursor.data.key, label: cursor.data.label, level: cursor.data.level, data: cursor.data });
        cursor = cursor.parent;
      }
      if (!chain.length) {
        return [{ key: "all", label: "全部", level: "all" }];
      }
      return chain;
    },
    selectBreadcrumb(item) {
      const treeNode = this.$refs.tree.getNode(item.key);
      if (treeNode) {
        this.$refs.tree.setCurrentKey(item.key);
        this.handleNodeClick(treeNode.data, treeNode);
      }
    },
    loadAggregate(companyId) {
      this.loadWeather();
      this.loading = true;
      const query = {};
      if (companyId) {
        query.companyId = companyId;
      }
      getMonitorOverview(null, query).then(response => {
        const data = response.data || response || {};
        this.summary = Object.assign(this.emptySummary(), data.summary || {});
        this.stationRows = data.stations || [];
        this.stationRankQuery.pageNum = 1;
        this.alarmRows = data.alarms || [];
        this.lineChartData = data.trend || this.emptyChart();
        this.chartReady = this.hasTrendData(this.lineChartData);
        this.loading = false;
      }).catch(() => {
        this.summary = this.emptySummary();
        this.stationRows = [];
        this.stationRankQuery.pageNum = 1;
        this.alarmRows = [];
        this.lineChartData = this.emptyChart();
        this.chartReady = false;
        this.loading = false;
      });
    },
    loadStation(stationId, companyId) {
      this.loadWeather(stationId);
      this.loading = true;
      const query = { stationId };
      if (companyId) {
        query.companyId = companyId;
      }
      getMonitorOverview(stationId, query).then(response => {
        const data = response.data || response || {};
        this.summary = Object.assign(this.emptySummary(), data.summary || {});
        this.selectedStation = data.selectedStation || {};
        if (this.current && this.current.level === "station" && String(this.current.stationId) === String(stationId)) {
          const stationName = this.selectedStation.stationName || this.current.label;
          this.current = Object.assign({}, this.current, {
            label: stationName,
            companyId: this.selectedStation.companyId || companyId
          });
          this.breadcrumb = [
            { key: "all", label: "全部", level: "all" },
            { key: "station-" + stationId, label: stationName, level: "station", data: this.current }
          ];
        }
        this.stationDevices = data.stationDevices || [];
        this.deviceManageQuery.pageNum = 1;
        this.energyFlow = data.energyFlow || {};
        this.lineChartData = data.trend || this.emptyChart();
        this.chartReady = this.hasTrendData(this.lineChartData);
        this.loading = false;
      }).catch(() => {
        this.selectedStation = {};
        this.stationDevices = [];
        this.deviceManageQuery.pageNum = 1;
        this.energyFlow = {};
        this.lineChartData = this.emptyChart();
        this.chartReady = false;
        this.loading = false;
      });
    },
    loadDevice(data) {
      this.loadWeather(data.stationId);
      this.deviceTab = "detail";
      this.loadDeviceDetail(data);
      this.historyRows = [];
      this.historyChartData = this.emptyChart();
      this.historyChartReady = false;
    },
    loadDeviceDetail(data) {
      this.deviceLoading = true;
      if (data.deviceType === "ESS") {
        getMonitorStorageDetail(data.deviceId).then(response => {
          const payload = response.data || response || {};
          this.deviceDetail = Object.assign({}, payload.detail || {});
          this.storageRealtimeRows = payload.realtimeMetrics || [];
          this.storageHealthRows = payload.healthRows || [];
          this.storageIdentityRows = payload.identityRows || [];
          this.storageUnits = payload.storageUnits || [];
          this.batteryPacks = payload.batteryPacks || [];
          this.deviceChartData = payload.socTrend || this.emptyChart();
          this.deviceChartReady = this.hasTrendData(this.deviceChartData);
          this.deviceLoading = false;
        }).catch(() => {
          this.resetStorageDetail();
          this.deviceLoading = false;
        });
        return;
      }
      getMonitorDeviceDetail({ deviceId: data.deviceId, stationId: data.stationId }).then(response => {
        const payload = response.data || response || {};
        this.deviceDetail = Object.assign({}, payload.detail || payload);
        this.deviceIdentityRows = payload.identityRows || [];
        this.deviceAssetRows = payload.assetRows || [];
        this.deviceMetricRows = payload.metricRows || [];
        this.deviceStatusRows = payload.statusRows || [];
        this.deviceChartData = payload.trend || this.emptyChart();
        this.deviceChartReady = this.hasTrendData(this.deviceChartData);
        this.deviceLoading = false;
      }).catch(() => {
        this.deviceDetail = {};
        this.deviceIdentityRows = [];
        this.deviceAssetRows = [];
        this.deviceMetricRows = [];
        this.deviceStatusRows = [];
        this.deviceChartData = this.emptyChart();
        this.deviceChartReady = false;
        this.deviceLoading = false;
      });
    },
    resetStorageDetail() {
      this.deviceDetail = {};
      this.storageRealtimeRows = [];
      this.storageHealthRows = [];
      this.storageIdentityRows = [];
      this.storageUnits = [];
      this.batteryPacks = [];
      this.deviceChartData = this.emptyChart();
      this.deviceChartReady = false;
    },
    handleDeviceTab(tab) {
      if (tab.name === "history" && !this.historyRows.length && !this.historyChartReady) {
        this.loadDeviceHistory();
      }
    },
    resetDeviceHistory() {
      this.historyRange = defaultHistoryRange();
      this.historyQuery.pageNum = 1;
      this.loadDeviceHistory();
    },
    loadDeviceHistory(preservePage) {
      if (this.current.level !== "device") {
        return;
      }
      const queryRange = normalizeHistoryRange(this.historyRange);
      const validationMessage = validateHistoryRange(queryRange);
      if (validationMessage) {
        this.$message.warning(validationMessage);
        return;
      }
      if (preservePage !== true) {
        this.historyQuery.pageNum = 1;
      }
      this.historyLoading = true;
      const params = {};
      if (queryRange && queryRange.length === 2) {
        params.startTime = queryRange[0];
        params.endTime = queryRange[1];
      }
      const request = this.isEssDevice
        ? getMonitorStorageHistory(this.current.deviceId, params)
        : getMonitorHistory(Object.assign({ deviceId: this.current.deviceId, stationId: this.current.stationId }, params));
      request.then(response => {
        const data = response.data || response || {};
        this.historyRows = data.historyRows || [];
        const maxPage = Math.max(1, Math.ceil(this.historyRows.length / this.historyQuery.pageSize));
        this.historyQuery.pageNum = Math.min(this.historyQuery.pageNum, maxPage);
        this.historyChartData = data.trend || this.emptyChart();
        this.historyChartReady = this.hasTrendData(this.historyChartData);
        this.historyLoading = false;
      }).catch(() => {
        this.historyRows = [];
        this.historyChartData = this.emptyChart();
        this.historyChartReady = false;
        this.historyLoading = false;
      });
    },
    loadWeather(stationId) {
      const seq = ++this.weatherRequestSeq;
      if (!stationId) {
        this.weatherData = null;
        return;
      }
      getStationWeather(stationId).then(response => {
        if (seq !== this.weatherRequestSeq) return;
        this.weatherData = normalizeWeather(response.data || response || {});
      }).catch(() => {
        if (seq === this.weatherRequestSeq) this.weatherData = null;
      });
    },
    drillToStation(row) {
      const key = "station-" + row.stationId;
      const treeNode = this.$refs.tree.getNode(key);
      if (treeNode) {
        this.$refs.tree.setCurrentKey(key);
        this.handleNodeClick(treeNode.data, treeNode);
        return;
      }
      this.current = { level: "station", stationId: row.stationId, companyId: row.companyId };
      this.level = "station";
      this.breadcrumb = [{ key: "all", label: "全部", level: "all" }, { key, label: row.stationName, level: "station" }];
      this.loadStation(row.stationId, row.companyId);
    },
    drillToDevice(row) {
      const deviceId = row && row.deviceId;
      if (deviceId == null) {
        return;
      }
      const key = "device-" + deviceId;
      const stationId = row.stationId != null
        ? row.stationId
        : (this.current && this.current.stationId);
      const companyId = row.companyId != null
        ? row.companyId
        : (this.current && this.current.companyId);
      const tree = this.$refs.tree;
      const openByTreeNode = node => {
        if (!node || !node.data) {
          return false;
        }
        tree.setCurrentKey(node.data.key || key);
        this.handleNodeClick(node.data, node);
        return true;
      };
      const existing = tree && tree.getNode(key);
      if (openByTreeNode(existing)) {
        return;
      }
      // 懒加载树未展开电站时设备节点不存在：先展开电站再选中设备（等同左侧树点击）
      const stationKey = stationId != null ? "station-" + stationId : null;
      const stationNode = stationKey && tree ? tree.getNode(stationKey) : null;
      if (stationNode && typeof stationNode.expand === "function") {
        stationNode.expand(() => {
          const loaded = tree.getNode(key);
          if (openByTreeNode(loaded)) {
            return;
          }
          this.openDeviceDetailFromRow(row, key, stationId, companyId);
        });
        return;
      }
      this.openDeviceDetailFromRow(row, key, stationId, companyId);
    },
    openDeviceDetailFromRow(row, key, stationId, companyId) {
      const data = {
        key,
        label: row.deviceName,
        level: "device",
        deviceId: row.deviceId,
        deviceType: row.deviceType,
        stationId,
        companyId
      };
      this.current = data;
      this.level = "device";
      this.treeCurrentKey = key;
      this.contentTab = "overview";
      const crumbs = [];
      (this.breadcrumb || []).forEach(item => {
        if (item.level === "device") {
          return;
        }
        crumbs.push(item);
      });
      if (!crumbs.length) {
        crumbs.push({ key: "all", label: "全部", level: "all" });
      }
      if (stationId != null && !crumbs.some(item => item.level === "station")) {
        crumbs.push({
          key: "station-" + stationId,
          label: (this.selectedStation && this.selectedStation.stationName) || "电站",
          level: "station"
        });
      }
      crumbs.push({ key, label: row.deviceName, level: "device" });
      this.breadcrumb = crumbs;
      if (this.$refs.tree) {
        this.$refs.tree.setCurrentKey(key);
      }
      this.loadDevice(data);
    },
    goStationAlarm(row) {
      this.$router.push({ path: "/ems-ops/alarm-current", query: { companyId: row.companyId, stationId: row.stationId } });
    },
    goDeviceAlarm(row) {
      this.$router.push({ path: "/ems-ops/alarm-current", query: { companyId: row.companyId, stationId: row.stationId, deviceId: row.deviceId } });
    },
    valueOf(value, fallback = "--") {
      return value === undefined || value === null || value === "" ? fallback : value;
    },
    formatNumber(value, digits, fallback) {
      return formatDisplayNumber(value, digits, fallback);
    },
    deviceTypeText,
    commStatusText,
    statusText,
    stationStatusText,
    revenueStatusText,
    revenueStatusTip,
    syncStatusText,
    metricText,
    unitText,
    qualityText,
    rowValueText
  }
};
</script>

<style scoped>
.monitor-overview.app-container {
  padding: 0;
  margin: 0;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
  height: calc(100vh - 4rem);
  min-height: calc(100vh - 4rem);
  box-sizing: border-box;
  overflow: hidden;
}

.monitor-layout {
  position: relative;
  display: grid;
  grid-template-columns: 17.5rem minmax(0, 1fr);
  gap: 0;
  height: 100%;
  background: #fff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  transition: grid-template-columns 0.28s ease;
}

.monitor-layout.is-tree-collapsed {
  grid-template-columns: 0 minmax(0, 1fr);
}

.monitor-tree-panel {
  display: flex;
  flex-direction: column;
  width: 17.5rem;
  min-width: 0;
  height: 100%;
  min-height: 0;
  padding: 1rem 0 0;
  background: #fff;
  border-right: 1px solid #dfdfdf;
  box-sizing: border-box;
  overflow: hidden;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.monitor-layout.is-tree-collapsed .monitor-tree-panel {
  width: 0;
  padding: 0;
  opacity: 0;
  border-right-color: transparent;
  pointer-events: none;
}

.tree-toggle-hide {
  position: absolute;
  top: 50%;
  left: 17.5rem;
  z-index: 20;
  width: 12px;
  height: 80px;
  margin-top: -40px;
  margin-left: -1px;
  cursor: pointer;
  line-height: 0;
  transition: left 0.28s ease, background-color 0.15s ease;
}

.tree-toggle-hide.is-collapsed {
  left: 0;
}

.tree-toggle-hide__icon {
  display: block;
  width: 12px;
  height: 80px;
  object-fit: contain;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.tree-toggle-hide:hover {
  background-color: #0a59f7;
  -webkit-mask: url("~@/assets/images/monitor/shou.png") center / 12px 80px no-repeat;
  mask: url("~@/assets/images/monitor/shou.png") center / 12px 80px no-repeat;
}

.tree-toggle-hide.is-collapsed:hover {
  -webkit-mask-image: url("~@/assets/images/monitor/zhan.png");
  mask-image: url("~@/assets/images/monitor/zhan.png");
}

.tree-toggle-hide:hover .tree-toggle-hide__icon {
  opacity: 0;
}

.tree-toggle-hide:hover::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5px;
  height: 5px;
  margin: -3px 0 0 -2px;
  border-left: 1.5px solid #fff;
  border-bottom: 1.5px solid #fff;
  transform: rotate(45deg);
  box-sizing: border-box;
}

.tree-toggle-hide.is-collapsed:hover::after {
  margin-left: -4px;
  transform: rotate(-135deg);
}

.monitor-tree-panel__search-wrap {
  flex-shrink: 0;
  padding: 0 0.75rem;
}

.dpdesign-input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.dpdesign-input-wrapper:hover,
.dpdesign-input-wrapper:focus-within {
  border-color: #0a59f7;
}

.dpdesign-input-wrapper__input {
  flex: 1 1 auto;
  min-width: 0;
}

.dpdesign-input-wrapper__input ::v-deep .el-input__inner {
  height: 30px;
  line-height: 30px;
  padding: 0 8px 0 12px;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #191919;
  font-size: 14px;
  box-shadow: none;
}

.dpdesign-input-wrapper__input ::v-deep .el-input__inner::placeholder {
  color: #909399;
}

.dpdesign-input-wrapper__input ::v-deep .el-input__inner:focus {
  background: transparent;
  box-shadow: none;
}

.dpdesign-input-wrapper__input ::v-deep .el-input__suffix {
  color: #707070;
}

.dpdesign-input-wrapper__divider {
  flex-shrink: 0;
  width: 1px;
  height: 16px;
  background: #d4d4d4;
}

.dpdesign-input-wrapper__search {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  color: #191919;
}

.dpdesign-input-wrapper__search-icon {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.monitor-tree-panel__tree-wrap {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0.5rem;
  padding: 0 0.5rem 0.5rem 0.5rem;
  overflow: auto;
}

.monitor-tree {
  background: transparent;
}

.monitor-tree ::v-deep .el-tree-node__content {
  height: 32px;
  padding-right: 4px;
  border-radius: 8px;
  background: transparent;
}

.monitor-tree ::v-deep .el-tree-node__content:hover {
  background: rgba(10, 89, 247, 0.06);
}

.monitor-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content {
  background: rgba(10, 89, 247, 0.1);
}

.monitor-tree ::v-deep .el-tree-node__expand-icon {
  color: rgba(0, 0, 0, 0.85);
  font-size: 12px;
  padding: 4px;
}

.monitor-tree ::v-deep .el-tree-node__expand-icon.is-leaf {
  color: transparent !important;
  cursor: default;
  pointer-events: none;
  visibility: hidden;
}

.monitor-tree__node {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: calc(100% - 8px);
  gap: 8px;
  font-size: 14px;
  color: #1c1c1c;
  line-height: 1.2;
}

.monitor-tree__icon {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  font-size: 14px;
  color: #707070;
}

.monitor-tree__icon-img {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
}

.monitor-tree__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monitor-content {
  display: flex;
  flex-direction: column;
  border: none;
  border-radius: 0;
  padding: 0.5rem 3rem 1rem;
  background: #fff;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  box-shadow: none;
  box-sizing: border-box;
}

.nco-monitor-station-header {
  flex-shrink: 0;
}

.nco-monitor-station-header-new {
  margin-bottom: 16px;
}

.nco-monitor-station-header-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
  gap: 1rem;
}

.nco-monitor-station-header-title .left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.nco-monitor-header-name-container {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 3rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1c1c1c;
}

.header-status-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.header-status-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: #ededed;
}

.header-status-avatar .budge_img {
  display: block;
  width: 1.4rem;
  height: 1.4rem;
  object-fit: contain;
}

.header-status-dot {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5ccbb1;
  box-shadow: 0 0 0 2px #fff;
}

.header-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nco-monitor-station-header-title .right {
  flex-shrink: 0;
}

.temperature-area {
  display: flex;
  font-size: 0.75rem;
  color: #1c1c1c;
}

.temperature-area .temperature-area-content {
  display: flex;
  padding: 0 1rem;
}

.temperature-area .after-line {
  position: relative;
}

.temperature-area .after-line::after {
  content: "";
  position: absolute;
  right: 0;
  top: 0;
  width: 1px;
  height: 100%;
  background-image: linear-gradient(transparent, #ccc 35% 65%, transparent);
}

.temperature-area .weather-condition {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.temperature-area .weather-condition-img {
  height: 1.5rem;
  line-height: 1;
}

.temperature-area .weather-condition-img img {
  height: 1.5rem;
  width: auto;
  vertical-align: baseline;
  object-fit: contain;
}

.temperature-area .weather-condition-content {
  margin: 0.15rem 0 0;
  color: #707070;
  line-height: 1.2;
}

.temperature-area .weather-temperature {
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.temperature-area .weather-temperature-content {
  font-size: 1.1rem;
  color: #1c1c1c;
  line-height: 1.2;
}

.temperature-area .weather-temperature-content .separator {
  padding: 0 2px;
}

.temperature-area .weather-temperature-unit,
.temperature-area .weather-time {
  color: #707070;
}

.temperature-area .weather-time {
  margin-top: 0.15rem;
  white-space: nowrap;
}

.nco-monitor-station-container {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.nco-monitor-station-header-card-wrapper.flex-wrapper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  flex-shrink: 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin-bottom: 24px;
  padding: 0.75rem;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
}

.nco-monitor-station-header-card {
  position: relative;
  min-width: 0;
  min-height: 5rem;
  display: flex;
  align-items: center;
  padding: 1rem 1.1rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* 行内竖向分割线（每行第 3 个不要） */
.nco-monitor-station-header-card:not(:nth-child(3n))::after {
  content: "";
  position: absolute;
  right: 0;
  top: 22%;
  bottom: 22%;
  width: 1px;
  background-color: #eee;
  transform: scaleX(0.5);
  transform-origin: right center;
}

/* 两行之间的横向分割线 */
.nco-monitor-station-header-card:nth-child(-n + 3) {
  border-bottom: 1px solid #eee;
}

.nco-monitor-station-header-card__icon {
  width: 3rem;
  height: 3rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
  object-fit: contain;
}

.nco-monitor-station-header-card__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.nco-monitor-station-header-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  min-width: 0;
}

.nco-monitor-station-header-card__value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1c1c1c;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nco-monitor-station-header-card__unit {
  font-size: 0.75rem;
  color: #707070;
  line-height: 1.2;
  flex-shrink: 0;
}

.nco-monitor-station-header-card__label-row {
  display: flex;
  align-items: center;
  margin-top: 0.2rem;
  min-width: 0;
}

.nco-monitor-station-header-card__label {
  font-size: 0.8rem;
  color: #707070;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nco-monitor-station-header-card__tip {
  margin-left: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  color: rgba(0, 0, 0, 0.85);
}

.nco-monitor-station-header-card__tip-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.nco-monitor-station-header-card__tip:hover {
  color: #0a59f7;
}

/* 与上方统计边框同宽：不用 el-row gutter，避免负 margin 撑破/缩窄 */
.company-charts-row {
  display: flex;
  align-items: stretch;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.company-charts-row__trend {
  flex: 1.7 1 0;
  min-width: 0;
}

.company-charts-row__status {
  flex: 1.15 1 0;
  min-width: 0;
}

.company-charts-row ::v-deep .ems-chart-container {
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
}

/* 电站视图：能量流 + 社会贡献 + 电站信息合并为一框 */
.station-detail-row {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: clamp(16px, 3vw, 120px);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin-bottom: 24px;
  padding: 32px clamp(16px, 3vw, 48px) 32px 24px;
  box-sizing: border-box;
  flex-shrink: 0;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
  /* 小屏优先挤右侧，能量图不缩小；仍不够时横向滚动 */
  overflow-x: auto;
}

.station-detail-row__panel {
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
  border: none;
  background: transparent;
}

.station-detail-row__panel--energy {
  /* 能量图尺寸固定，小屏绝不压缩 */
  flex: 0 0 420px;
  width: 420px;
  max-width: 420px;
  min-width: 420px;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.station-detail-row__panel--energy ::v-deep .nco-monitor-energy-flow {
  flex: 1 1 auto;
  width: 100%;
  min-height: 280px;
}

.station-detail-row__panel--social {
  flex: 1 1 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  max-width: 168px;
}

.station-detail-row__panel--info {
  flex: 1 1 160px;
  width: auto;
  max-width: 300px;
  margin-left: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.nco-monitor-social-contribution {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: clamp(16px, 2vw, 28px);
  height: 100%;
  min-height: 220px;
  min-width: 0;
  box-sizing: border-box;
}

.nco-monitor-social-contribution__item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nco-monitor-social-contribution__icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  object-fit: contain;
}

.nco-monitor-social-contribution__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nco-monitor-social-contribution__value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.2;
}

.nco-monitor-social-contribution__value {
  color: #1a1a1a;
  font-size: clamp(16px, 1.6vw, 22px);
  font-weight: 700;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nco-monitor-social-contribution__unit {
  color: #8c8c8c;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
}

.nco-monitor-social-contribution__label {
  color: #8c8c8c;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
}

.station-info-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(8px, 1.5vw, 24px);
  padding: 8px 0;
  border: none;
  min-width: 0;
}

.station-info-item span {
  color: #666666;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  white-space: nowrap;
  flex-shrink: 0;
}

.station-info-item b {
  color: #000000;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  text-align: right;
  word-break: break-all;
  overflow: hidden;
  min-width: 0;
}

/* 电站视图：功率趋势单独一行，样式对齐公司视图 */
.station-charts-row {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  flex-shrink: 0;
  padding-bottom: 8px;
}

.station-charts-row ::v-deep .ems-chart-container {
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
}

.station-charts-row ::v-deep .ems-chart-container__body {
  overflow: visible;
}

.tab-wrapper.flex-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-weight: 400;
  margin-bottom: 25px;
}

.tab-wrapper.light-tab-wrapper .monitor-tab a {
  color: #212121;
  text-decoration: none;
  cursor: pointer;
}

.tab-wrapper.light-tab-wrapper .monitor-tab:hover a {
  color: #0a59f7;
}

.tab-wrapper.light-tab-wrapper .monitor-tab.selected {
  border: 0;
  font-size: 1.1rem;
}

.tab-wrapper.light-tab-wrapper .monitor-tab.selected a {
  color: #0a59f7;
}

.tab-wrapper .monitor-tab {
  font-size: 1.1rem;
  padding: 0.85rem 1.2rem 0.85rem 1.2rem;
  background-color: transparent;
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.tab-wrapper .monitor-tab a {
  opacity: 1;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-wrapper .monitor-tab:first-of-type {
  padding-left: 0;
}

.tab-wrapper .monitor-tab:not(:last-of-type)::after {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  margin-top: -6px;
  height: 12px;
  width: 1px;
  background-color: #ccc;
}

.monitor-tab-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE / Edge */
}

.monitor-tab-body::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none; /* Chrome / Safari */
}

/* el-row gutter 会用负 margin 撑出父级宽度，需限制列最小宽度 */
.monitor-tab-body ::v-deep .el-row {
  max-width: 100%;
}

.monitor-tab-body ::v-deep .el-col {
  min-width: 0;
}

.monitor-station-rank {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 0;
  padding: 32px 16px 16px;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 5px;
  background: #fff;
}

.monitor-station-rank .table-shell__wrap {
  flex: 0 0 auto;
  background: #fff;
}

.monitor-station-rank .table-footer {
  flex-shrink: 0;
  margin-top: 8px;
  min-height: auto;
  padding-top: 4px;
}

.monitor-tab-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  color: #909399;
  font-size: 14px;
}

.monitor-station-view-pane {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 0 0 auto;
}

.monitor-station-view-switch {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
  overflow: visible;
}

.monitor-station-view-switch__tabs {
  display: inline-flex;
  align-items: stretch;
  flex-shrink: 0;
  height: 50px;
  padding: 0;
  box-sizing: border-box;
  border-bottom: 1px solid #dfdfdf;
}

.monitor-subtab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 24px;
  color: #212121;
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.monitor-subtab:hover {
  color: #0a59f7;
}

.monitor-subtab.selected {
  color: #0a59f7;
  background: transparent;
  box-shadow: none;
  font-weight: 400;
}

.monitor-subtab.selected::after {
  content: "";
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 0;
  height: 2px;
  background: #0a59f7;
  border-radius: 1px;
}

.monitor-subtab + .monitor-subtab::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  margin-top: -7px;
  width: 1px;
  height: 14px;
  background: #ccc;
}

.monitor-station-view-body {
  flex: 0 0 auto;
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
  background: #fff;
}

.detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.mb12 {
  margin-bottom: 12px;
}

.detail-card {
  border-radius: 6px;
}

.detail-card--top-gap {
  margin-top: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-item span {
  color: #909399;
  min-width: 90px;
}

.detail-item b {
  color: #303133;
  text-align: right;
  word-break: break-all;
}

.hw-device-history-divider {
  margin: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.hw-device-detail .ems-list-search .el-form-item {
  margin-right: 16px;
  margin-bottom: 12px;
}

.hw-device-detail .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.hw-device-detail >>> .ems-list-search__control {
  width: 12rem;
}

.hw-device-detail >>> .ems-list-search__daterange {
  width: calc(12rem * 2 + 90px + 16px);
}

.storage-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.storage-grid__item {
  padding: 10px 12px;
  border-radius: 4px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
}

.storage-grid__value {
  font-size: 16px;
  font-weight: 600;
  color: #1c1c1c;
  word-break: break-all;
}

.storage-grid__label {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.hw-device-detail {
  width: 100%;
  min-height: 100%;
  background: #fff;
}

.hw-device-detail__tabs >>> .el-tabs__header {
  margin: 0 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.hw-device-detail__tabs >>> .el-tabs__nav-wrap::after {
  display: none;
}

.hw-device-detail__tabs >>> .el-tabs__item {
  height: 42px;
  line-height: 42px;
  padding: 0 20px;
  color: #212121;
  font-size: 14px;
  font-weight: 400;
}

.hw-device-detail__tabs >>> .el-tabs__item.is-active {
  color: #0a59f7;
  font-weight: 500;
}

.hw-device-detail__tabs >>> .el-tabs__active-bar {
  height: 2px;
  background-color: #0a59f7;
}

.hw-device-detail__body {
  padding: 0 0 24px;
}

.hw-device-detail__metrics {
  margin-bottom: 24px;
}

/* 设备详情仅 3 项，单行无需底部分割线 */
.hw-device-detail__metrics.nco-monitor-station-header-card-wrapper .nco-monitor-station-header-card:nth-child(-n + 3) {
  border-bottom: none;
}

.hw-device-detail__section {
  margin-bottom: 28px;
}

.hw-device-detail__section:last-child {
  margin-bottom: 0;
}

.hw-part-title {
  margin: 0 0 16px;
  color: #1c1c1c;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.hw-basic-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  border-top: 1px solid #e8e8e8;
}

.hw-basic-info__cell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  min-height: 40px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  box-sizing: border-box;
}

/* 斑马纹按行：第 1/2/3 列同属一行 */
.hw-basic-info__cell:nth-child(6n + 1),
.hw-basic-info__cell:nth-child(6n + 2),
.hw-basic-info__cell:nth-child(6n + 3) {
  background: #fafafa;
}

.hw-basic-info__label,
.hw-basic-info__value {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 8px 12px;
  box-sizing: border-box;
}

.hw-basic-info__label {
  justify-content: flex-start;
  padding-left: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
}

.hw-basic-info__label > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hw-circle {
  display: inline-block;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.hw-basic-info__value {
  color: #1c1c1c;
  font-size: 14px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hw-device-table {
  width: 100%;
}

.hw-device-history-footer {
  min-height: 36px;
  margin-top: 8px;
}

.hw-device-table >>> .el-table__header-wrapper th {
  background: #fafafa !important;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 700;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.hw-device-table >>> .el-table__body-wrapper td {
  color: #1c1c1c;
  border-bottom: 1px solid #f0f0f0;
}

.hw-device-table >>> .el-table::before,
.hw-device-table >>> .el-table--border::after,
.hw-device-table >>> .el-table--group::after {
  display: none;
}

.hw-device-table >>> .el-table th.is-leaf,
.hw-device-table >>> .el-table td {
  border-right: none;
}

.hw-device-detail >>> .ems-chart-container {
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 0;
}

.hw-device-detail >>> .history-trend-chart {
  background: #fff;
}

.hw-device-detail >>> .ems-chart-container__title:empty {
  display: none;
}

.hw-device-detail >>> .ems-chart-container__head {
  margin-bottom: 8px;
}

.hw-device-detail >>> .ems-chart-container__subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

@media (max-width: 1100px) {
  .hw-basic-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hw-basic-info__cell:nth-child(6n + 1),
  .hw-basic-info__cell:nth-child(6n + 2),
  .hw-basic-info__cell:nth-child(6n + 3) {
    background: #fff;
  }

  .hw-basic-info__cell:nth-child(4n + 1),
  .hw-basic-info__cell:nth-child(4n + 2) {
    background: #fafafa;
  }
}

@media (max-width: 720px) {
  .hw-basic-info {
    grid-template-columns: minmax(0, 1fr);
  }

  .hw-basic-info__cell:nth-child(4n + 1),
  .hw-basic-info__cell:nth-child(4n + 2),
  .hw-basic-info__cell:nth-child(6n + 1),
  .hw-basic-info__cell:nth-child(6n + 2),
  .hw-basic-info__cell:nth-child(6n + 3) {
    background: #fff;
  }

  .hw-basic-info__cell:nth-child(odd) {
    background: #fafafa;
  }
}
</style>
