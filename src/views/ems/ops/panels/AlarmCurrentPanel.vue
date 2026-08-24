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

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table v-loading="loading" :data="alarmList" class="ems-list-table">
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column label="告警时间" align="center" prop="firstTime" width="170">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.firstTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最后时间" align="center" prop="lastTime" width="170">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.lastTime || scope.row.firstTime) }}</span>
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
            <el-table-column label="状态" align="center" width="100">
              <template slot-scope="scope">
                <el-tag v-if="scope.row" type="danger" size="mini">活动中</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="来源" align="center" prop="sourceType" width="120">
              <template slot-scope="scope">
                <span>{{ sourceTypeText(scope.row.sourceType) }}</span>
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
                <el-tooltip content="确认" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-check"
                    class="ems-list-table__ops-btn"
                    @click="handleAck(scope.row)"
                    v-hasPermi="['ems:alarm:ack']"
                  />
                </el-tooltip>
                <el-tooltip content="清除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-circle-close"
                    class="ems-list-table__ops-btn"
                    @click="handleClear(scope.row)"
                    v-hasPermi="['ems:alarm:clear']"
                  />
                </el-tooltip>
                <el-tooltip content="历史" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-document"
                    class="ems-list-table__ops-btn"
                    @click="goHistory(scope.row)"
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
import { ackAlarmEvent, clearAlarmEvent, getCurrentAlarms } from '@/api/ems/alarm'
import { parseTime } from '@/utils/witos'
import { CompanySelector, StationSelector } from '@/components/ems'
import tableEmptyIcon from '@/assets/images/empty.svg'

function getPayload(response) {
  return response && response.data !== undefined ? response.data : response || {}
}

function getListData(response) {
  const payload = getPayload(response)
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
  name: 'AlarmCurrentPanel',
  components: { CompanySelector, StationSelector },
  data() {
    return {
      loading: false,
      showAdvanced: false,
      total: 0,
      alarmList: [],
      companyOptions: [],
      stationOptions: [],
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        companyId: undefined,
        stationId: undefined,
        deviceId: undefined,
        deviceName: undefined,
        alarmName: undefined,
        sourceType: undefined,
        severity: undefined
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
      if (!this.$route || !this.$route.query) {
        return
      }
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
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = getListData(response).map(item => ({
          label: item.companyName,
          value: item.companyId
        }))
      })
    },
    loadStationOptions() {
      const query = { pageNum: 1, pageSize: 9999 }
      if (this.queryParams.companyId) {
        query.companyId = this.queryParams.companyId
      }
      listStation(query).then(response => {
        this.stationOptions = getListData(response).map(item => ({
          label: item.stationName,
          value: item.stationId
        }))
      })
    },
    handleCompanyChange() {
      this.queryParams.stationId = undefined
      this.loadStationOptions()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        companyId: undefined,
        stationId: undefined,
        deviceId: undefined,
        deviceName: undefined,
        alarmName: undefined,
        sourceType: undefined,
        severity: undefined
      }
      this.loadStationOptions()
      this.getList()
    },
    getList() {
      this.loading = true
      getCurrentAlarms(this.queryParams).then(response => {
        const data = getPayload(response)
        this.alarmList = data.rows || data.list || data.records || getListData(response) || []
        this.total = data.total || data.count || this.alarmList.length
      }).catch(() => {
        this.alarmList = []
        this.total = 0
        this.$message.error('当前告警加载失败')
      }).then(() => {
        this.loading = false
      })
    },
    handleAck(row) {
      this.$modal.confirm('是否确认该活动告警？').then(() => ackAlarmEvent(row.id)).then(() => {
        this.$modal.msgSuccess('确认成功')
        this.getList()
      }).catch(() => {})
    },
    handleClear(row) {
      this.$modal.confirm('是否确认手动清除该活动告警？').then(() => clearAlarmEvent(row.id)).then(() => {
        this.$modal.msgSuccess('清除成功')
        this.getList()
      }).catch(() => {})
    },
    goHistory(row) {
      const query = {}
      const source = row || this.queryParams
      if (source.companyId) {
        query.companyId = source.companyId
      }
      if (source.stationId) {
        query.stationId = source.stationId
      }
      if (source.deviceId) {
        query.deviceId = source.deviceId
      }
      if (source.severity) {
        query.severity = source.severity
      }
      this.$router.push({
        path: '/ems-ops/alarm-history',
        query
      })
    },
    severityText(value) {
      const map = {
        LOW: '低',
        MEDIUM: '中',
        HIGH: '高',
        CRITICAL: '紧急'
      }
      return map[value] || value || '-'
    },
    severityTagType(value) {
      const map = {
        LOW: 'info',
        MEDIUM: 'warning',
        HIGH: 'danger',
        CRITICAL: 'danger'
      }
      return map[value] || 'info'
    },
    sourceTypeText(value) {
      const map = {
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
