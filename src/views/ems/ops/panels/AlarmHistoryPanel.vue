<template>
  <div class="alarm-panel">
<el-form
        ref="queryForm"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="公司" prop="companyId">
          <company-selector
            v-model="queryParams.companyId"
            :options="companyOptions"
            clearable
            show-all
            :all-value="undefined"
            placeholder="全部公司"
            class="ems-list-search__control"
            @change="handleCompanyChange"
          />
        </el-form-item>
        <el-form-item label="电站" prop="stationId">
          <station-selector
            v-model="queryParams.stationId"
            :options="stationOptions"
            clearable
            show-all
            :all-value="undefined"
            placeholder="全部电站"
            class="ems-list-search__control"
          />
        </el-form-item>
        <el-form-item label="设备" prop="deviceName">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button type="text" class="expand-trigger" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? '收起' : '展开' }}
            <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
          </el-button>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-form
        v-show="showAdvanced"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search ems-list-search--advanced"
        @submit.native.prevent
      >
        <el-form-item label="告警名称" prop="alarmName">
          <el-input
            v-model="queryParams.alarmName"
            placeholder="请输入告警名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="级别" prop="severity">
          <el-select
            v-model="queryParams.severity"
            placeholder="告警级别"
            clearable
            class="ems-list-search__control"
          >
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
            <el-option label="紧急" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源" prop="sourceType">
          <el-select
            v-model="queryParams.sourceType"
            placeholder="告警来源"
            clearable
            class="ems-list-search__control"
          >
            <el-option label="能源管理系统" value="EMS" />
            <el-option label="监控采集系统" value="SCADA" />
            <el-option label="电池管理系统" value="BMS" />
            <el-option label="储能变流器" value="PCS" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-form
        v-show="showAdvanced"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search ems-list-search--advanced ems-list-search--advanced-extra"
        @submit.native.prevent
      >
        <el-form-item label="状态" prop="alarmStatus">
          <el-select
            v-model="queryParams.alarmStatus"
            placeholder="告警状态"
            clearable
            class="ems-list-search__control"
          >
            <el-option label="活动中" value="ACTIVE" />
            <el-option label="已确认" value="ACKED" />
            <el-option label="已恢复" value="CLEARED" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围" prop="timeRange">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="ems-list-search__daterange"
            @change="handleTimeRangeChange"
          />
        </el-form-item>
      </el-form>

      <div class="alarm-toolbar">
        <div class="alarm-toolbar__left" />
        <div class="alarm-toolbar__right">
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['ems:alarm:export']"
          >导出</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table v-loading="loading" :data="alarmList" class="ems-list-table">
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column label="首次告警时间" align="center" prop="firstTime" width="170">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.firstTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最后告警时间" align="center" prop="lastTime" width="170">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.lastTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="恢复时间" align="center" prop="clearTime" width="170">
              <template slot-scope="scope">
                <span>{{ scope.row.clearTime ? parseTime(scope.row.clearTime) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="电站" align="center" prop="stationName" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="设备" align="center" prop="deviceName" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="告警名称" align="center" prop="alarmName" min-width="180" :show-overflow-tooltip="true" />
            <el-table-column label="次数" align="center" prop="occurrenceCount" width="80" />
            <el-table-column label="级别" align="center" prop="severity" width="100">
              <template slot-scope="scope">
                <el-tag :type="severityTagType(scope.row.severity)" size="mini">{{ severityText(scope.row.severity) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="alarmStatus" width="110">
              <template slot-scope="scope">
                <el-tag :type="statusTagType(scope.row.alarmStatus)" size="mini">{{ statusText(scope.row.alarmStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="清除类型" align="center" prop="clearType" width="100">
              <template slot-scope="scope">
                <span>{{ clearTypeText(scope.row.clearType) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="清除人" align="center" prop="clearBy" width="120" />
            <el-table-column label="确认人" align="center" prop="ackBy" width="120" />
            <el-table-column label="来源" align="center" prop="sourceType" width="120">
              <template slot-scope="scope">
                <span>{{ sourceTypeText(scope.row.sourceType) }}</span>
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
                <el-tooltip
                  v-if="scope.row.alarmStatus === 'ACTIVE'"
                  content="确认"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-check"
                    class="ems-list-table__ops-btn"
                    @click="handleAck(scope.row)"
                    v-hasPermi="['ems:alarm:ack']"
                  />
                </el-tooltip>
                <el-tooltip
                  v-if="scope.row.alarmStatus === 'ACTIVE' || scope.row.alarmStatus === 'ACKED'"
                  content="清除"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-circle-close"
                    class="ems-list-table__ops-btn"
                    @click="handleClear(scope.row)"
                    v-hasPermi="['ems:alarm:clear']"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="table-footer">
          <pagination
            v-show="total > 0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
  </div>
</template>

<script>
import { listCompany } from '@/api/ems/company'
import { listStation } from '@/api/ems/station'
import { ackAlarmEvent, clearAlarmEvent, exportAlarmHistory, getAlarmHistory } from '@/api/ems/alarm'
import { parseTime } from '@/utils/witos'
import { CompanySelector, StationSelector } from '@/components/ems'
import tableEmptyIcon from '@/assets/images/empty.svg'

function getPayload(response) {
  return response && response.data !== undefined ? response.data : response || {}
}

function getList(response) {
  var payload = getPayload(response)
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
  return []
}

export default {
  name: 'AlarmHistoryPanel',
  components: { CompanySelector, StationSelector },
  data() {
    return {
      loading: false,
      showAdvanced: false,
      total: 0,
      alarmList: [],
      companyOptions: [],
      stationOptions: [],
      timeRange: [],
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        companyId: undefined,
        stationId: undefined,
        deviceId: undefined,
        deviceName: undefined,
        alarmName: undefined,
        severity: undefined,
        sourceType: undefined,
        alarmStatus: undefined,
        startTime: undefined,
        endTime: undefined
      }
    }
  },
  created() {
    this.applyRouteQuery()
    this._routeQueryKey = JSON.stringify((this.$route && this.$route.query) || {})
    this.loadCompanyOptions()
    this.loadStationOptions()
    this.getList()
  },
  activated() {
    this.syncFromRoute()
  },
  methods: {
    parseTime,
    syncFromRoute() {
      const key = JSON.stringify((this.$route && this.$route.query) || {})
      if (key === this._routeQueryKey) {
        return
      }
      this._routeQueryKey = key
      this.applyRouteQuery()
      this.loadStationOptions()
      this.handleQuery()
    },
    applyRouteQuery() {
      if (this.$route && this.$route.query) {
        if (this.$route.query.companyId) {
          this.queryParams.companyId = Number(this.$route.query.companyId)
        }
        if (this.$route.query.stationId) {
          this.queryParams.stationId = Number(this.$route.query.stationId)
        }
        if (this.$route.query.deviceId) {
          this.queryParams.deviceId = Number(this.$route.query.deviceId)
        }
        if (this.$route.query.severity) {
          this.queryParams.severity = this.$route.query.severity
        }
      }
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = getList(response).map(item => {
          return { label: item.companyName, value: item.companyId }
        })
      })
    },
    loadStationOptions() {
      var query = { pageNum: 1, pageSize: 9999 }
      if (this.queryParams.companyId) {
        query.companyId = this.queryParams.companyId
      }
      listStation(query).then(response => {
        this.stationOptions = getList(response).map(item => {
          return { label: item.stationName, value: item.stationId }
        })
      })
    },
    handleCompanyChange() {
      this.queryParams.stationId = undefined
      this.loadStationOptions()
    },
    handleTimeRangeChange(value) {
      this.queryParams.startTime = value && value[0] ? value[0] : undefined
      this.queryParams.endTime = value && value[1] ? value[1] : undefined
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.timeRange = []
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        companyId: undefined,
        stationId: undefined,
        deviceId: undefined,
        deviceName: undefined,
        alarmName: undefined,
        severity: undefined,
        sourceType: undefined,
        alarmStatus: undefined,
        startTime: undefined,
        endTime: undefined
      }
      this.loadStationOptions()
      this.getList()
    },
    getList() {
      this.loading = true
      getAlarmHistory(this.queryParams).then(response => {
        var data = getPayload(response)
        this.alarmList = data.rows || data.list || data.records || getList(response) || []
        this.total = data.total || data.count || this.alarmList.length
      }).catch(() => {
        this.alarmList = []
        this.total = 0
        this.$message.error('历史告警加载失败')
      }).then(() => {
        this.loading = false
      })
    },
    handleAck(row) {
      this.$modal.confirm('确认该告警？').then(() => {
        return ackAlarmEvent(row.id)
      }).then(() => {
        this.$modal.msgSuccess('确认成功')
        this.getList()
      }).catch(() => {})
    },
    handleClear(row) {
      this.$modal.confirm('确认手动清除该告警？').then(() => {
        return clearAlarmEvent(row.id)
      }).then(() => {
        this.$modal.msgSuccess('清除成功')
        this.getList()
      }).catch(() => {})
    },
    handleExport() {
      exportAlarmHistory(this.queryParams)
    },
    severityText(value) {
      var map = {
        LOW: '低',
        MEDIUM: '中',
        HIGH: '高',
        CRITICAL: '紧急'
      }
      return map[value] || value || '-'
    },
    severityTagType(value) {
      var map = {
        LOW: 'info',
        MEDIUM: 'warning',
        HIGH: 'warning',
        CRITICAL: 'danger'
      }
      return map[value] || 'info'
    },
    statusText(value) {
      var map = {
        ACTIVE: '活动中',
        ACKED: '已确认',
        CLEARED: '已恢复'
      }
      return map[value] || value || '-'
    },
    statusTagType(value) {
      var map = {
        ACTIVE: 'danger',
        ACKED: 'warning',
        CLEARED: 'success'
      }
      return map[value] || 'info'
    },
    clearTypeText(value) {
      var map = {
        AUTO: '自动',
        MANUAL: '手动'
      }
      return map[value] || '-'
    },
    sourceTypeText(value) {
      var map = {
        EMS: '能源管理系统',
        SCADA: '监控采集系统',
        BMS: '电池管理系统',
        PCS: '储能变流器'
      }
      return map[value] || value || '-'
    }
  }
}
</script>

<style scoped>
.alarm-panel .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.alarm-panel .ems-list-search--advanced {
  margin-top: 12px;
}

.alarm-panel .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.alarm-panel .ems-list-search--advanced-extra {
  margin-top: 12px;
}

.alarm-panel ::v-deep .ems-list-search__control {
  width: 11rem;
}

.alarm-panel ::v-deep .ems-list-search__daterange.el-input__inner,
.alarm-panel ::v-deep .ems-list-search__daterange.el-range-editor,
.alarm-panel ::v-deep .ems-list-search__daterange {
  /* 2×input(11rem) + 中间一项 label(90px) + form-item 间距(16px) */
  width: calc(11rem * 2 + 90px + 16px) !important;
  max-width: none;
}

.alarm-panel .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.alarm-panel .expand-trigger:hover,
.alarm-panel .expand-trigger:focus {
  color: #0747c7;
}

.alarm-panel .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.alarm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 12px;
}

.alarm-toolbar__right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.alarm-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}
</style>
