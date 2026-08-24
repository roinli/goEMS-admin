<template>
  <div class="alarm-panel">
<div class="alarm-tip" role="alert">
        <i class="el-icon-info alarm-tip__icon" aria-hidden="true" />
        <div class="alarm-tip__message">
          <div>告警推送规则仅对新上报的告警生效，规则生效前已上报到系统的当前告警不会发送通知邮件。</div>
          <div>当符合推送规则的新告警上报到系统后，会立即触发规则向通知对象发送邮件。</div>
          <div>当接收者时区与服务器时区不同时，推送邮件中的告警时间按服务器所在时区显示。</div>
          <div>默认按启用在前、停用在后排序；同状态下按修改时间倒序排列。</div>
        </div>
      </div>

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
        <el-form-item label="名称" prop="ruleName">
          <el-input
            v-model="queryParams.ruleName"
            placeholder="请输入告警规则名称"
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
        <el-form-item label="设备类型" prop="deviceType">
          <el-select
            v-model="queryParams.deviceType"
            placeholder="设备类型"
            clearable
            class="ems-list-search__control"
          >
            <el-option label="逆变器" value="INVERTER" />
            <el-option label="储能变流器" value="PCS" />
            <el-option label="储能" value="ESS" />
            <el-option label="电表" value="METER" />
            <el-option label="网关" value="GATEWAY" />
            <el-option label="其他" value="OTHER" />
          </el-select>
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
        <el-form-item label="状态" prop="enabled">
          <el-select
            v-model="queryParams.enabled"
            placeholder="是否启用"
            clearable
            class="ems-list-search__control"
          >
            <el-option label="启用" value="1" />
            <el-option label="停用" value="0" />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="alarm-divider" role="separator" />

      <div class="alarm-toolbar">
        <div class="alarm-toolbar__left" />
        <div class="alarm-toolbar__right">
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['ems:alarm:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="goMailConfig"
            v-hasPermi="['ems:alarm:mail-config']"
          >邮件配置</el-button>
          <el-button
            plain
            @click="goNotifyLog"
            v-hasPermi="['ems:alarm:notify-log']"
          >通知日志</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['ems:alarm:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="ruleList"
            class="ems-list-table"
            @selection-change="handleSelectionChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
  </div>
</template>
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="规则名称" align="center" prop="ruleName" min-width="170" :show-overflow-tooltip="true" />
            <el-table-column label="公司" align="center" prop="companyName" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="电站" align="center" prop="stationName" min-width="160" :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ scope.row.stationName || '全部电站' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="设备类型" align="center" prop="deviceType" width="120">
              <template slot-scope="scope">
                <span>{{ deviceTypeText(scope.row.deviceType) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="指标" align="center" prop="metricKey" min-width="180" :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ metricText(scope.row.metricKey) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="条件" align="center" prop="conditionOp" width="90" />
            <el-table-column label="阈值" align="center" prop="thresholdValue" width="100" />
            <el-table-column label="持续时长(秒)" align="center" prop="durationSeconds" width="120" />
            <el-table-column label="级别" align="center" prop="severity" width="100">
              <template slot-scope="scope">
                <el-tag :type="severityTagType(scope.row.severity)" size="mini">{{ severityText(scope.row.severity) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="通知" align="center" prop="notifyEnabled" width="90">
              <template slot-scope="scope">
                <el-tag :type="scope.row.notifyEnabled === '1' ? 'success' : 'info'" size="mini">
                  {{ scope.row.notifyEnabled === '1' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="通知通道" align="center" min-width="180" :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ channelText(scope.row.notifyChannels) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="接收人" align="center" prop="notifyTargets" min-width="200" :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ scope.row.notifyTargets || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="enabled" width="90">
              <template slot-scope="scope">
                <el-tag :type="scope.row.enabled === '1' ? 'success' : 'info'" size="mini">
                  {{ scope.row.enabled === '1' ? '启用' : '停用' }}
                </el-tag>
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
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['ems:alarm:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['ems:alarm:remove']"
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

    <alarm-rule-form-dialog
      :visible.sync="formOpen"
      :rule-id="formRuleId"
      :default-company-id="formDefaultCompanyId"
      :default-station-id="formDefaultStationId"
      @success="getList"
    />
  </div>
</template>

<script>
import { listCompany } from '@/api/ems/company'
import { listStation } from '@/api/ems/station'
import { delAlarmRule, listAlarmRules } from '@/api/ems/alarm'
import { CompanySelector, StationSelector } from '@/components/ems'
import tableEmptyIcon from '@/assets/images/empty.svg'
import AlarmRuleFormDialog from '../components/AlarmRuleFormDialog.vue'

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
  name: 'AlarmSettingPanel',
  components: { CompanySelector, StationSelector, AlarmRuleFormDialog },
  data() {
    return {
      loading: false,
      showAdvanced: false,
      total: 0,
      ruleList: [],
      companyOptions: [],
      stationOptions: [],
      ids: [],
      single: true,
      multiple: true,
      tableEmptyIcon,
      formOpen: false,
      formRuleId: undefined,
      formDefaultCompanyId: undefined,
      formDefaultStationId: undefined,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        companyId: undefined,
        stationId: undefined,
        ruleName: undefined,
        deviceType: undefined,
        severity: undefined,
        enabled: undefined
      }
    }
  },
  created() {
    this.applyRouteQuery()
    this._routeQueryKey = JSON.stringify((this.$route && this.$route.query) || {})
    this.loadCompanyOptions()
    this.loadStationOptions()
    this.getList()
    this.openFormFromRoute()
  },
  activated() {
    this.syncFromRoute()
  },
  methods: {
    syncFromRoute() {
      const key = JSON.stringify((this.$route && this.$route.query) || {})
      if (key === this._routeQueryKey) {
        return
      }
      this._routeQueryKey = key
      this.applyRouteQuery()
      this.loadStationOptions()
      this.openFormFromRoute()
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
    },
    openFormFromRoute() {
      if (!this.$route || !this.$route.query) {
        return
      }
      const query = this.$route.query
      if (query.ruleId) {
        this.openForm({ ruleId: Number(query.ruleId) })
        this.clearFormRouteQuery()
        return
      }
      if (query.openCreate === '1') {
        this.openForm({
          companyId: query.companyId,
          stationId: query.stationId
        })
        this.clearFormRouteQuery()
      }
    },
    clearFormRouteQuery() {
      const query = Object.assign({}, this.$route.query)
      delete query.openCreate
      delete query.ruleId
      this.$router.replace({ path: this.$route.path, query }).catch(() => {})
    },
    openForm(options) {
      const opts = options || {}
      this.formRuleId = opts.ruleId || undefined
      this.formDefaultCompanyId = opts.companyId !== undefined && opts.companyId !== null && opts.companyId !== ''
        ? Number(opts.companyId)
        : this.queryParams.companyId
      this.formDefaultStationId = opts.stationId !== undefined && opts.stationId !== null && opts.stationId !== ''
        ? Number(opts.stationId)
        : this.queryParams.stationId
      this.formOpen = true
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = getList(response).map(item => {
          return { label: item.companyName, value: item.companyId }
        })
      })
    },
    loadStationOptions() {
      const query = { pageNum: 1, pageSize: 9999 }
      if (this.queryParams.companyId) {
        query.companyId = this.queryParams.companyId
      }
      listStation(query).then(response => {
        this.stationOptions = getList(response).map(item => ({
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
        ruleName: undefined,
        deviceType: undefined,
        severity: undefined,
        enabled: undefined
      }
      this.loadStationOptions()
      this.getList()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    getList() {
      this.loading = true
      listAlarmRules(this.queryParams).then(response => {
        var data = getPayload(response)
        this.ruleList = data.rows || data.list || data.records || getList(response) || []
        this.total = data.total || data.count || this.ruleList.length
      }).catch(() => {
        this.ruleList = []
        this.total = 0
        this.$message.error('告警规则加载失败')
      }).then(() => {
        this.loading = false
      })
    },
    handleAdd() {
      this.openForm({
        companyId: this.queryParams.companyId,
        stationId: this.queryParams.stationId
      })
    },
    goMailConfig() {
      this.$router.push({
        path: '/ems-ops/alarm-mail-config',
        query: this.queryParams.companyId ? { companyId: this.queryParams.companyId } : {}
      })
    },
    goNotifyLog() {
      const query = {}
      if (this.queryParams.companyId) {
        query.companyId = this.queryParams.companyId
      }
      if (this.queryParams.stationId) {
        query.stationId = this.queryParams.stationId
      }
      this.$router.push({
        path: '/ems-ops/alarm-notify-log',
        query
      })
    },
    handleUpdate(row) {
      this.openForm({ ruleId: row.id })
    },
    handleDelete(row) {
      var ruleIds = row && row.id ? [row.id] : this.ids
      if (!ruleIds.length) {
        return
      }
      this.$modal.confirm('是否确认删除选中的告警规则？').then(() => {
        return Promise.all(ruleIds.map(id => delAlarmRule(id)))
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.getList()
      }).catch(() => {})
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
    channelText(value) {
      if (!value) {
        return '--'
      }
      const map = {
        EMAIL: '邮件'
      }
      return String(value).split(',').filter(item => item === 'EMAIL').map(item => map[item] || item).join(' / ') || '邮件'
    },
    deviceTypeText(value) {
      const map = {
        INVERTER: '逆变器',
        PCS: '储能变流器',
        ESS: '储能',
        METER: '电表',
        GATEWAY: '网关',
        OTHER: '其他'
      }
      return map[value] || value || '-'
    },
    metricText(value) {
      const map = {
        inverter_active_power: '逆变器有功功率',
        pcs_active_power: '储能变流器有功功率',
        storage_soc: '储能荷电状态',
        storage_soh: '储能健康状态',
        grid_power: '并网点功率',
        storage_charge_discharge_power: '储能充放电功率'
      }
      return map[value] || value || '-'
    }
  }
}
</script>

<style scoped>
.alarm-tip {
  display: flex;
  align-items: flex-start;
  box-sizing: border-box;
  margin: 0 0 32px;
  padding: 15px 19px;
  border: 1px solid #5990fd;
  border-radius: 12px;
  background-color: rgba(89, 144, 253, 0.1);
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  word-wrap: break-word;
}

.alarm-tip__icon {
  flex-shrink: 0;
  margin-right: 12px;
  color: #5990fd;
  font-size: 20px;
  line-height: 1;
}

.alarm-tip__message {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.85);
}

.alarm-tip__message > div + div {
  margin-top: 4px;
}

.alarm-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.alarm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
