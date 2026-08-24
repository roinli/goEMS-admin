<template>
  <div class="ems-home-page ems-home-list">
    <home-hero-band
      active="list"
      :metrics="heroMetrics"
      :status-segments="statusSegments"
      :alarm-segments="alarmSegments"
      :station-total="enrichedStations.length"
      :alarm-total="alarmTotal"
      @setting="openKpiSetting"
      @status-legend="goStatusLegend"
      @alarm-legend="goAlarmLegend"
    />

    <section class="list-band">
      <div class="toolbar-row">
        <el-form
          :model="queryParams"
          size="small"
          :inline="true"
          class="toolbar-query-form"
          @submit.native.prevent
        >
          <el-form-item label="电站名称">
            <el-input
              v-model="queryParams.stationName"
              placeholder="请输入电站名称"
              clearable
              class="filter-item"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="国家/地区">
            <el-select v-model="queryParams.country" placeholder="请选择国家/地区" clearable class="filter-item">
              <el-option v-for="item in countryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备类型">
            <el-select v-model="queryParams.deviceType" placeholder="请选择设备类型" clearable class="filter-item">
              <el-option v-for="item in stationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备SN">
            <el-input
              v-model="queryParams.deviceSn"
              placeholder="请输入设备SN"
              clearable
              class="filter-item"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item v-show="showAdvanced" label="电站状态">
            <el-select v-model="queryParams.status" placeholder="请选择电站状态" clearable class="filter-item">
              <el-option label="正常" value="NORMAL" />
              <el-option label="停用" value="DISABLED" />
              <el-option label="建设中" value="CONSTRUCTION" />
              <el-option label="故障" value="WARNING" />
            </el-select>
          </el-form-item>
          <el-form-item v-show="showAdvanced" label="所属公司">
            <el-select v-model="queryParams.companyId" placeholder="请选择所属公司" clearable class="filter-item">
              <el-option v-for="item in companyOptions" :key="item.companyId" :label="item.companyName" :value="item.companyId" />
            </el-select>
          </el-form-item>
          <el-form-item class="toolbar-query-form__actions">
            <el-button type="text" class="expand-trigger" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? '收起' : '展开' }}
              <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
            </el-button>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="toolbar-row__actions">
          <el-button size="small" type="primary" @click="handleAdd">新建电站</el-button>
        </div>
      </div>

      <div v-loading="loading" class="table-shell">
        <div class="table-shell__wrap">
          <el-table :data="pagedStations" class="station-table" @sort-change="handleSortChange">
            <template slot="empty">
              <div class="station-table__empty">
                <img :src="emptyIcon" class="station-table__empty-icon" alt="">
                <p class="station-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column
              v-if="isColumnEnabled('status')"
              prop="status"
              label="状态"
              width="86"
              align="center"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span class="status-dot" :class="'is-' + stationStatusTone(scope.row.status)" />
              </template>
            </el-table-column>
            <el-table-column v-if="isColumnEnabled('thumbnail')" label="电站实景" width="124" align="center">
              <template slot-scope="scope">
                <button type="button" class="station-thumb station-thumb--button" :class="'is-seed-' + scope.row.thumbnailSeed" @click="goStationDetail(scope.row)" />
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('stationName')"
              prop="stationName"
              label="电站名称"
              min-width="150"
              sortable="custom"
            >
              <template slot-scope="scope">
                <el-button type="text" class="station-link" @click="goStationDetail(scope.row)">{{ scope.row.stationName }}</el-button>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('companyName')"
              prop="companyName"
              label="所属公司"
              min-width="160"
              show-overflow-tooltip
              sortable="custom"
            />
            <el-table-column
              v-if="isColumnEnabled('country')"
              prop="country"
              label="国家/地区"
              min-width="120"
              sortable="custom"
            />
            <el-table-column
              v-if="isColumnEnabled('commissionDate')"
              prop="commissionDate"
              label="并网时间"
              min-width="118"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span>{{ formatDate(scope.row.commissionDate) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('capacityKw')"
              prop="capacityKw"
              label="组串总容量(kWp)"
              min-width="180"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span>{{ formatNumber(scope.row.capacityKw) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('optimizerCount')"
              prop="optimizerCount"
              label="优化器个数"
              min-width="150"
              sortable="custom"
            />
            <el-table-column
              v-if="isColumnEnabled('storageLabel')"
              prop="storageLabel"
              label="储能"
              min-width="90"
              sortable="custom"
            />
            <el-table-column
              v-if="isColumnEnabled('currentPower')"
              prop="currentPower"
              label="当前功率(kW)"
              min-width="150"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span>{{ formatNumber(scope.row.currentPower) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('equivalentHours')"
              prop="equivalentHours"
              label="当日等效发电小时"
              min-width="180"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span>{{ formatNumber(scope.row.equivalentHours) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('todayGeneration')"
              prop="todayGeneration"
              label="当日发电量(度)"
              min-width="180"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span>{{ formatNumber(scope.row.todayGeneration) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isColumnEnabled('totalGeneration')"
              prop="totalGeneration"
              label="累计发电量(度)"
              min-width="160"
              sortable="custom"
            >
              <template slot-scope="scope">
                <span>{{ formatNumber(scope.row.totalGeneration) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="120"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template slot-scope="scope">
                <el-tooltip content="监控" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-data-analysis"
                    class="ems-list-table__ops-btn"
                    @click="goStationDetail(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip content="当前告警" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-warning-outline"
                    class="ems-list-table__ops-btn"
                    @click="goCurrentAlarm(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip content="历史告警" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-document"
                    class="ems-list-table__ops-btn"
                    @click="goHistoryAlarm(scope.row)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>

          <!--表头右侧列设置 -->
          <button
            ref="columnSettingTrigger"
            type="button"
            class="table-column-setting"
            title="选择列"
            @click="openColumnDialog"
          >
            <i class="el-icon-setting" />
          </button>
        </div>

        <div class="table-footer">
          <pagination
            :total="filteredStations.length"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="handlePagination"
          />
        </div>
      </div>
    </section>

    <kpi-setting-dialog
      :visible.sync="kpiDialogVisible"
      :anchor="kpiSettingAnchor"
      v-model="kpiKeys"
      @confirm="persistKpiKeys"
    />

    <!-- 选择列：气泡样式 -->
    <div v-show="columnDialogVisible" ref="columnPopoverRoot" class="column-popover-root">
      <div class="column-popover__mask" @click="columnDialogVisible = false" />
      <div
        ref="columnPopoverPanel"
        class="column-popover"
        :style="columnPopoverStyle"
        @click.stop
      >
        <span class="column-popover__arrow" :style="columnArrowStyle" />
        <div class="column-popover__header">
          <span class="column-popover__title">选择列</span>
          <i class="el-icon-close column-popover__close" @click="columnDialogVisible = false" />
        </div>
        <div class="column-select">
          <el-checkbox
            :value="isAllColumnsChecked"
            :indeterminate="isColumnIndeterminate"
            @change="toggleAllColumns"
          >全选</el-checkbox>
          <div class="column-select__options">
            <el-checkbox
              v-for="item in stationColumns"
              :key="item.key"
              :value="draftColumnKeys.indexOf(item.key) !== -1"
              :disabled="item.fixed"
              @change="checked => toggleColumn(item.key, checked)"
            >{{ item.label }}</el-checkbox>
          </div>
        </div>
        <div class="column-popover__footer">
          <el-button size="small" @click="restoreDefaultColumns">恢复默认</el-button>
          <el-button size="small" @click="columnDialogVisible = false">取消</el-button>
          <el-button size="small" type="primary" @click="confirmColumns">确定</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getHomeListSummary } from '@/api/ems/home'
import { listCompany } from '@/api/ems/company'
import HomeHeroBand from './shared/HomeHeroBand.vue'
import KpiSettingDialog from './shared/KpiSettingDialog.vue'
import emptyIcon from '@/assets/images/empty.svg'
import {
  HOME_EMPTY_STATE,
  DEFAULT_KPI_KEYS,
  buildAlarmSegments,
  buildCompanyMap,
  buildKpiMetrics,
  buildStatusSegments,
  enrichStationRows,
  formatDisplayNumber,
  getPayload,
  getRows,
  normalizeKpiKeys
} from './shared/homeSupport'

const DEFAULT_QUERY = {
  pageNum: 1,
  pageSize: 10,
  stationName: '',
  country: '',
  deviceType: '',
  deviceSn: '',
  status: '',
  companyId: undefined
}

const COLUMN_STORAGE_KEY = 'ems-home-list-columns'
const KPI_STORAGE_KEY = 'ems-home-kpi-params'

const DEFAULT_COLUMNS = [
  { key: 'status', label: '状态', fixed: true },
  { key: 'thumbnail', label: '电站实景' },
  { key: 'stationName', label: '电站名称' },
  { key: 'companyName', label: '所属公司' },
  { key: 'country', label: '国家/地区' },
  { key: 'commissionDate', label: '并网时间' },
  { key: 'capacityKw', label: '组串总容量' },
  { key: 'optimizerCount', label: '优化器个数' },
  { key: 'storageLabel', label: '储能' },
  { key: 'currentPower', label: '当前功率' },
  { key: 'equivalentHours', label: '当日等价发电时' },
  { key: 'todayGeneration', label: '当日发电量' },
  { key: 'totalGeneration', label: '累计发电量' }
]

const STATUS_ROUTE_MAP = {
  正常电站: 'NORMAL',
  故障电站: 'WARNING',
  断连电站: 'DISABLED'
}

const ALARM_ROUTE_MAP = {
  紧急告警: 'CRITICAL',
  重要告警: 'HIGH',
  次要告警: 'MEDIUM',
  提示告警: 'LOW'
}

export default {
  name: 'EmsHomeList',
  components: { HomeHeroBand, KpiSettingDialog },
  data() {
    return {
      loading: false,
      emptyIcon,
      showAdvanced: false,
      kpiDialogVisible: false,
      kpiSettingAnchor: null,
      kpiKeys: DEFAULT_KPI_KEYS.slice(),
      columnDialogVisible: false,
      columnPopoverStyle: {},
      columnArrowStyle: {},
      draftColumnKeys: DEFAULT_COLUMNS.map(item => item.key),
      sortProp: '',
      sortOrder: '',
      queryParams: Object.assign({}, DEFAULT_QUERY),
      homeData: HOME_EMPTY_STATE,
      stationSource: HOME_EMPTY_STATE.stationRows.slice(),
      companyOptions: [],
      stationColumns: DEFAULT_COLUMNS.slice(),
      enabledColumnKeys: DEFAULT_COLUMNS.map(item => item.key)
    }
  },
  computed: {
    companyMap() {
      return buildCompanyMap(this.companyOptions)
    },
    enrichedStations() {
      return enrichStationRows(this.stationSource, this.companyMap)
    },
    heroMetrics() {
      return buildKpiMetrics(this.kpiKeys, this.homeData.summaryCards, this.enrichedStations)
    },
    selectableColumns() {
      return this.stationColumns.filter(item => !item.fixed)
    },
    isAllColumnsChecked() {
      return this.selectableColumns.every(item => this.draftColumnKeys.indexOf(item.key) !== -1)
    },
    isColumnIndeterminate() {
      const checkedCount = this.selectableColumns.filter(item => this.draftColumnKeys.indexOf(item.key) !== -1).length
      return checkedCount > 0 && checkedCount < this.selectableColumns.length
    },
    statusSegments() {
      return buildStatusSegments(this.enrichedStations)
    },
    alarmSegments() {
      return buildAlarmSegments(this.homeData.alarmRows)
    },
    alarmTotal() {
      return this.alarmSegments.reduce((sum, item) => sum + item.value, 0)
    },
    countryOptions() {
      const set = {}
      this.companyOptions.forEach(item => {
        if (item.country) {
          set[item.country] = true
        }
      })
      return Object.keys(set).map(value => ({ value, label: this.stationTypeText(value) }))
    },
    stationTypeOptions() {
      const set = {}
      this.stationSource.forEach(item => {
        if (item.stationType) {
          set[item.stationType] = true
        }
      })
      return Object.keys(set)
    },
    // 筛选由接口完成，这里不再本地过滤
    filteredStations() {
      return this.enrichedStations
    },
    sortedStations() {
      const list = this.filteredStations.slice()
      if (!this.sortProp || !this.sortOrder) {
        return list
      }
      const prop = this.sortProp
      const dir = this.sortOrder === 'ascending' ? 1 : -1
      const numericKeys = {
        capacityKw: true,
        optimizerCount: true,
        currentPower: true,
        equivalentHours: true,
        todayGeneration: true,
        totalGeneration: true
      }
      return list.sort((a, b) => {
        const va = a[prop]
        const vb = b[prop]
        if (va == null && vb == null) {
          return 0
        }
        if (va == null) {
          return 1
        }
        if (vb == null) {
          return -1
        }
        if (numericKeys[prop] || prop === 'commissionDate') {
          const na = prop === 'commissionDate' ? new Date(va).getTime() || 0 : Number(va)
          const nb = prop === 'commissionDate' ? new Date(vb).getTime() || 0 : Number(vb)
          if (na === nb) {
            return 0
          }
          return na > nb ? dir : -dir
        }
        const sa = String(va)
        const sb = String(vb)
        if (sa === sb) {
          return 0
        }
        return sa > sb ? dir : -dir
      })
    },
    pagedStations() {
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize
      return this.sortedStations.slice(start, start + this.queryParams.pageSize)
    }
  },
  created() {
    this.restoreKpiKeys()
    this.applyRouteQuery()
    this.restoreColumns()
    this.loadPage()
  },
  mounted() {
    if (this.$refs.columnPopoverRoot) {
      document.body.appendChild(this.$refs.columnPopoverRoot)
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateColumnPopoverPosition)
    window.removeEventListener('scroll', this.updateColumnPopoverPosition, true)
    const root = this.$refs.columnPopoverRoot
    if (root && root.parentNode) {
      root.parentNode.removeChild(root)
    }
  },
  watch: {
    '$route.query': {
      deep: true,
      handler() {
        this.applyRouteQuery()
        this.handleQuery()
      }
    },
    columnDialogVisible(val) {
      if (val) {
        this.$nextTick(() => {
          this.updateColumnPopoverPosition()
        })
        window.addEventListener('resize', this.updateColumnPopoverPosition)
        window.addEventListener('scroll', this.updateColumnPopoverPosition, true)
      } else {
        window.removeEventListener('resize', this.updateColumnPopoverPosition)
        window.removeEventListener('scroll', this.updateColumnPopoverPosition, true)
      }
    }
  },
  methods: {
    applyRouteQuery() {
      if (!this.$route || !this.$route.query) {
        return
      }
      const query = this.$route.query
      this.queryParams = Object.assign({}, this.queryParams, {
        stationName: '',
        country: '',
        status: '',
        companyId: undefined
      })
      this.showAdvanced = false
      if (query.status) {
        this.queryParams.status = query.status
        this.showAdvanced = true
      }
      if (query.companyId) {
        this.queryParams.companyId = Number(query.companyId)
        this.showAdvanced = true
      }
      if (query.stationName) {
        this.queryParams.stationName = query.stationName
      }
      if (query.country) {
        this.queryParams.country = query.country
      }
    },
    restoreColumns() {
      try {
        const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY)
        if (!raw) {
          return
        }
        const keys = JSON.parse(raw)
        if (Array.isArray(keys) && keys.length) {
          const availableKeys = this.stationColumns.map(item => item.key)
          const fixedKeys = this.stationColumns.filter(item => item.fixed).map(item => item.key)
          this.enabledColumnKeys = availableKeys.filter(key => keys.indexOf(key) !== -1 || fixedKeys.indexOf(key) !== -1)
        }
      } catch (error) {}
    },
    persistColumns() {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(this.enabledColumnKeys))
    },
    restoreKpiKeys() {
      try {
        const raw = window.localStorage.getItem(KPI_STORAGE_KEY)
        if (raw) {
          this.kpiKeys = normalizeKpiKeys(JSON.parse(raw))
        }
      } catch (error) {
        this.kpiKeys = DEFAULT_KPI_KEYS.slice()
      }
    },
    persistKpiKeys(keys) {
      this.kpiKeys = normalizeKpiKeys(keys)
      window.localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(this.kpiKeys))
    },
    openKpiSetting(el) {
      this.kpiSettingAnchor = el || null
      this.kpiDialogVisible = true
    },
    stationTypeText(value) {
      const map = {
        BASIC: '基础站',
        ACCESS: '接入站',
        STRING: '组串站',
        STORAGE: '储能站',
        COMMERCIAL: '工商业',
        RESIDENTIAL: '户用',
        OTHER: '其他'
      }
      return map[value] || value || '-'
    },
    openColumnDialog() {
      this.draftColumnKeys = this.enabledColumnKeys.slice()
      this.columnDialogVisible = true
    },
    handleSortChange({ prop, order }) {
      this.sortProp = prop || ''
      this.sortOrder = order || ''
      this.queryParams.pageNum = 1
    },
    updateColumnPopoverPosition() {
      const el = this.$refs.columnSettingTrigger
      if (!el || typeof el.getBoundingClientRect !== 'function') {
        return
      }
      const rect = el.getBoundingClientRect()
      const panelWidth = 360
      const gap = 10
      const arrowHalf = 7
      let left = rect.right - panelWidth + 8
      left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12))
      let top = rect.bottom + gap
      const panel = this.$refs.columnPopoverPanel
      const panelHeight = panel ? panel.offsetHeight : 420
      if (top + panelHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - panelHeight - gap)
      }
      const arrowLeft = rect.left + rect.width / 2 - left - arrowHalf
      this.columnPopoverStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${panelWidth}px`,
        zIndex: 3000
      }
      this.columnArrowStyle = {
        left: `${Math.max(16, Math.min(arrowLeft, panelWidth - 28))}px`
      }
    },
    toggleColumn(key, checked) {
      const index = this.draftColumnKeys.indexOf(key)
      if (checked && index === -1) {
        this.draftColumnKeys.push(key)
      } else if (!checked && index !== -1) {
        this.draftColumnKeys.splice(index, 1)
      }
    },
    toggleAllColumns(checked) {
      const fixedKeys = this.stationColumns.filter(item => item.fixed).map(item => item.key)
      if (checked) {
        this.draftColumnKeys = this.stationColumns.map(item => item.key)
      } else {
        this.draftColumnKeys = fixedKeys
      }
    },
    restoreDefaultColumns() {
      this.draftColumnKeys = DEFAULT_COLUMNS.map(item => item.key)
    },
    confirmColumns() {
      const fixedKeys = this.stationColumns.filter(item => item.fixed).map(item => item.key)
      const ordered = this.stationColumns
        .map(item => item.key)
        .filter(key => this.draftColumnKeys.indexOf(key) !== -1 || fixedKeys.indexOf(key) !== -1)
      this.enabledColumnKeys = ordered.length ? ordered : fixedKeys
      this.persistColumns()
      this.columnDialogVisible = false
    },
    isColumnEnabled(key) {
      return this.enabledColumnKeys.indexOf(key) !== -1
    },
    loadPage() {
      this.loading = true
      const summaryQuery = {
        stationName: this.queryParams.stationName || undefined,
        country: this.queryParams.country || undefined,
        deviceType: this.queryParams.deviceType || undefined,
        deviceSn: this.queryParams.deviceSn || undefined,
        status: this.queryParams.status || undefined,
        companyId: this.queryParams.companyId || undefined
      }
      Promise.all([
        getHomeListSummary(summaryQuery),
        listCompany({ pageNum: 1, pageSize: 9999 })
      ]).then(([homeResponse, companyResponse]) => {
        const homePayload = getPayload(homeResponse)
        const companyPayload = getPayload(companyResponse)
        this.homeData = {
          summaryCards: homePayload.summaryCards || HOME_EMPTY_STATE.summaryCards,
          alarmRows: homePayload.alarmRows || HOME_EMPTY_STATE.alarmRows,
          chartData: homePayload.chartData || HOME_EMPTY_STATE.chartData
        }
        this.stationSource = getRows(homePayload && homePayload.stationRows)
        this.companyOptions = getRows(companyPayload)
      }).catch(() => {
        this.homeData = HOME_EMPTY_STATE
        this.stationSource = []
        this.companyOptions = []
        this.$message.error('列表视图数据加载失败')
      }).then(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.loadPage()
    },
    resetQuery() {
      this.queryParams = Object.assign({}, DEFAULT_QUERY)
      this.showAdvanced = false
      this.loadPage()
    },
    handlePagination() {
      // 分页在前端切片；筛选条件变更已通过 loadPage 拉取接口数据
    },
    handleAdd() {
      this.$router.push({ path: '/ems-station/create' })
    },
    goStatusLegend(item) {
      const status = STATUS_ROUTE_MAP[item.name]
      this.$router.push({
        path: '/ems-station/index',
        query: status ? { status } : {}
      })
    },
    goAlarmLegend(item) {
      const severity = ALARM_ROUTE_MAP[item.name]
      this.$router.push({
        path: '/ems-ops/alarm-current',
        query: severity ? { severity } : {}
      })
    },
    goStationDetail(row) {
      this.$router.push({ path: '/ems-monitor/overview', query: { companyId: row.companyId, stationId: row.stationId }})
    },
    goCurrentAlarm(row) {
      this.$router.push({ path: '/ems-ops/alarm-current', query: { companyId: row.companyId, stationId: row.stationId }})
    },
    goHistoryAlarm(row) {
      this.$router.push({ path: '/ems-ops/alarm-history', query: { companyId: row.companyId, stationId: row.stationId }})
    },
    formatDate(value) {
      if (!value) {
        return '--'
      }
      return String(value).slice(0, 10)
    },
    formatNumber(value, digits) {
      return formatDisplayNumber(value, digits)
    },
    stationStatusTone(status) {
      if (status === 'WARNING' || status === 'FAULT') {
        return 'warning'
      }
      if (status === 'DISABLED') {
        return 'offline'
      }
      return 'normal'
    }
  }
}
</script>

<style scoped>
.ems-home-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: calc(100vh - 4rem);
}

.list-band {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 1.5rem;
  padding: 28px 32px 16px;
  border-radius: 8px;
  background: #fff;
}

.toolbar-row {
  position: relative;
}

.toolbar-query-form {
  width: calc(100% - 6.25rem);
  min-width: 0;

  ::v-deep .el-form-item {
    margin-right: 0.5rem;
    margin-bottom: 0.75rem;
  }

  ::v-deep label.el-form-item__label {
    color: rgba(0, 0, 0, 0.85);
    padding-right: 8px;
    line-height: 32px;
    text-align: left;
    white-space: nowrap;
    font-weight: 400 !important;
  }

  ::v-deep .el-form-item__content {
    line-height: 32px;
  }

  ::v-deep .el-input__inner,
  ::v-deep .el-button {
    border-radius: 6px;
  }

  ::v-deep .el-input__inner::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  ::v-deep .el-input__inner::-webkit-input-placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  ::v-deep .el-select .el-input__inner::placeholder,
  ::v-deep .el-select .el-input.is-focus .el-input__inner::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
}

.toolbar-query-form__actions {
  ::v-deep .el-form-item__content {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.toolbar-row__actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;

  ::v-deep .el-button:not(.is-circle) {
    border-radius: 6px;
  }
}

.column-config__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}

.column-config__group {
  display: grid;
  gap: 8px;
}

.column-select__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
}

.column-select__options .el-checkbox {
  margin-right: 0;
}

.column-select {
  max-height: 320px;
  overflow-y: auto;
  padding: 16px 20px;
}

.filter-item {
  width: 12rem;
}

.expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
}

.table-shell {
  padding: 0;
  background: transparent;
}

.table-shell__wrap {
  position: relative;
  border: 1px solid #e7e8e9;
  border-radius: 8px;
  overflow: hidden;
}

.table-column-setting {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 56px;
  padding: 0;
  border: 0;
  background: #f8f8f8;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.table-column-setting:hover {
  color: #0a59f7;
  background: #f0f0f0;
}

.table-column-setting i {
  font-size: 16px;
}

.station-table {
  width: 100%;
  border: none;
  border-radius: 0;
  overflow: hidden;

  &::before {
    display: none;
  }

  ::v-deep .el-table__empty-block {
    min-height: 280px;
  }

  ::v-deep .el-table__empty-text {
    line-height: normal;
  }

  ::v-deep .el-table__header-wrapper th,
  ::v-deep .el-table__fixed-header-wrapper th {
    height: 56px;
    padding: 0;
    background-color: #f8f8f8 !important;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid #e5e6eb !important;
  }

  ::v-deep .el-table__header-wrapper .cell,
  ::v-deep .el-table__fixed-header-wrapper .cell {
    display: flex;
    align-items: center;
    line-height: 1.2;
    padding-left: 16px;
    padding-right: 16px;
  }

  ::v-deep .el-table__header-wrapper th.is-center .cell,
  ::v-deep .el-table__fixed-header-wrapper th.is-center .cell {
    justify-content: center;
  }

  ::v-deep .el-table__body-wrapper td,
  ::v-deep .el-table__fixed-body-wrapper td {
    height: 56px;
    min-height: 56px;
    padding: 0;
    border-bottom: 1px solid #e5e6eb !important;
    color: rgba(0, 0, 0, 0.85);
    font-size: 14px;
  }

  ::v-deep .el-table__body-wrapper .cell,
  ::v-deep .el-table__fixed-body-wrapper .cell {
    line-height: 22px;
    padding-left: 16px;
    padding-right: 16px;
  }

  ::v-deep .el-table__body tr:hover > td,
  ::v-deep .el-table__body tr.hover-row > td {
    background-color: #f3f3f4 !important;
  }

  ::v-deep .el-table__fixed,
  ::v-deep .el-table__fixed-right {
    &::before {
      background-color: #e5e6eb;
    }
  }

  ::v-deep .el-table__body tr:last-child td {
    border-bottom: none !important;
  }
}

.station-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 9px 16px;
}

.station-table__empty-icon {
  width: 96px;
  height: auto;
  display: block;
  user-select: none;
  pointer-events: none;
}

.station-table__empty-text {
  margin: 0;
  font-size: 14px;
  line-height: 22px;
  color: rgb(119, 119, 119);
}

.station-thumb {
  width: 62px;
  height: 36px;
  margin: 0 auto;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(16, 45, 76, 0.06);
}

.station-thumb--button {
  display: block;
  border: 0;
  cursor: pointer;
}

.station-thumb.is-seed-0 {
  background: linear-gradient(180deg, #79b3f4 0%, #c2def7 54%, #416aa2 55%, #5f86bd 100%);
}

.station-thumb.is-seed-1 {
  background: linear-gradient(180deg, #95c8ff 0%, #bfdcff 42%, #44618c 43%, #688bbb 100%);
}

.station-thumb.is-seed-2 {
  background: linear-gradient(180deg, #75add8 0%, #a9d0f8 44%, #35547c 45%, #5f7aa9 100%);
}

.station-thumb.is-seed-3 {
  background: linear-gradient(180deg, #8ac0ff 0%, #d6ebff 48%, #475b88 49%, #6281bc 100%);
}

.station-link {
  padding: 0;
  font-size: 15px;
}

.status-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.status-dot.is-normal {
  background: #68c84f;
}

.status-dot.is-warning {
  background: #ff8f2b;
}

.status-dot.is-offline {
  background: #c3cedc;
}

.table-footer {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 8px 0 0;
  font-size: 14px;
  color: #546177;
}

.table-footer >>> .pagination-container {
  width: 100%;
  height: auto;
  margin: 0;
  padding: 0 !important;
  background: transparent;
}

.table-footer >>> .el-pagination {
  position: static;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
}

.table-footer >>> .el-pagination__total {
  margin-right: auto;
  margin-left: 0;
}

.table-footer >>> .el-pagination__jump {
  margin-right: 0;
}

@media (max-width: 992px) {
  .list-band {
    padding: 24px 20px 16px;
  }

  .toolbar-row {
    padding-top: 40px;
  }

  .toolbar-query-form {
    width: 100%;
  }

  .filter-item {
    width: 100%;
  }

  .table-footer {
    padding-bottom: 12px;
  }
}
</style>

<style>
.ems-home-list .toolbar-query-form .el-form-item__label {
  font-weight: 400 !important;
  color: rgba(0, 0, 0, 0.85);
}

.ems-home-list.ems-home-page,
.hasTagsView .ems-home-list.ems-home-page {
  min-height: calc(100vh - 4rem);
}

/*搜索区 input / select / 按钮圆角 + placeholder */
.ems-home-list .toolbar-query-form .el-input__inner,
.ems-home-list .toolbar-query-form .el-button,
.ems-home-list .toolbar-row__actions .el-button:not(.is-circle) {
  border-radius: 6px;
}

.ems-home-list .toolbar-query-form .el-input__inner::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

.ems-home-list .toolbar-query-form .el-input__inner::-webkit-input-placeholder {
  color: rgba(0, 0, 0, 0.4);
}

/*表格 */
.ems-home-list .table-shell__wrap {
  position: relative;
  border: 1px solid #e7e8e9;
  border-radius: 8px;
  overflow: hidden;
}

.ems-home-list .station-table {
  border: none !important;
  border-radius: 0 !important;
  overflow: hidden;
}

.ems-home-list .station-table::before {
  display: none;
}

.ems-home-list .station-table .el-table__header-wrapper th,
.ems-home-list .station-table .el-table__fixed-header-wrapper th {
  height: 56px;
  background-color: #f8f8f8 !important;
  color: rgba(0,0,0,0.85);
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #e5e6eb !important;
}

.ems-home-list .station-table .el-table__header-wrapper .cell,
.ems-home-list .station-table .el-table__fixed-header-wrapper .cell {
  display: flex;
  align-items: center;
  line-height: 1.2;
}

.ems-home-list .station-table .el-table__header-wrapper th.is-center .cell,
.ems-home-list .station-table .el-table__fixed-header-wrapper th.is-center .cell {
  justify-content: center;
}

.ems-home-list .station-table .caret-wrapper {
  width: 16px;
  height: 26px;
  margin-left: 8px;
}

.ems-home-list .station-table .sort-caret {
  left: 2px;
  border-width: 6px;
}

.ems-home-list .station-table .sort-caret.ascending {
  top: 0;
  border-bottom-color: #c0c4cc;
}

.ems-home-list .station-table .sort-caret.descending {
  bottom: 0;
  border-top-color: #c0c4cc;
}

.ems-home-list .station-table .ascending .sort-caret.ascending {
  border-bottom-color: #0a59f7 !important;
}

.ems-home-list .station-table .descending .sort-caret.descending {
  border-top-color: #0a59f7 !important;
}

.ems-home-list .station-table .el-table__body-wrapper td,
.ems-home-list .station-table .el-table__fixed-body-wrapper td {
  height: 56px;
  min-height: 56px;
  font-size: 14px;
  color: rgba(0,0,0,0.85);
  border-bottom: 1px solid #e5e6eb !important;
}

.ems-home-list .station-table .el-table__body tr:hover > td,
.ems-home-list .station-table .el-table__body tr.hover-row > td {
  background-color: #f3f3f4 !important;
}

/* 选择列气泡 */
.column-popover-root {
  position: relative;
  z-index: 3000;
}

.column-popover__mask {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 2999;
}

.column-popover {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(17, 26, 44, 0.16);
  padding: 0 0 16px;
  box-sizing: border-box;
}

.column-popover__arrow {
  position: absolute;
  top: -7px;
  width: 14px;
  height: 14px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(17, 26, 44, 0.04);
  z-index: 1;
}

.column-popover__header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #ececec;
}

.column-popover__title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.column-popover__close {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.column-popover__close:hover {
  color: rgba(0, 0, 0, 0.75);
}

.column-popover__footer {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 0;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.column-popover .column-select {
  position: relative;
  z-index: 2;
  background: #fff;
}
</style>
