<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="760px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="alarm-rule-form-dialog"
    @closed="handleClosed"
  >
    <el-form
      ref="form"
      v-loading="formLoading"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="alarm-rule-form"
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="公司" prop="companyId">
            <company-selector
              v-model="form.companyId"
              :options="companyOptions"
              :clearable="false"
              placeholder="请选择公司"
              style="width: 100%"
              @change="handleCompanyChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电站" prop="stationId">
            <station-selector
              v-model="form.stationId"
              :options="stationOptions"
              clearable
              show-all
              :all-value="0"
              placeholder="全部电站"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="规则名称" prop="ruleName">
            <el-input v-model="form.ruleName" placeholder="请输入规则名称" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备类型" prop="deviceType">
            <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%">
              <el-option label="逆变器" value="INVERTER" />
              <el-option label="储能变流器" value="PCS" />
              <el-option label="储能" value="ESS" />
              <el-option label="电表" value="METER" />
              <el-option label="网关" value="GATEWAY" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="监控指标" prop="metricKey">
            <el-select v-model="form.metricKey" placeholder="请选择监控指标" filterable style="width: 100%">
              <el-option v-for="item in metricOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="告警级别" prop="severity">
            <el-select v-model="form.severity" placeholder="请选择级别" style="width: 100%">
              <el-option label="低" value="LOW" />
              <el-option label="中" value="MEDIUM" />
              <el-option label="高" value="HIGH" />
              <el-option label="紧急" value="CRITICAL" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="比较符" prop="conditionOp">
            <el-select v-model="form.conditionOp" placeholder="请选择比较符" style="width: 100%">
              <el-option label="大于" value=">" />
              <el-option label="大于等于" value=">=" />
              <el-option label="小于" value="<" />
              <el-option label="小于等于" value="<=" />
              <el-option label="等于" value="=" />
              <el-option label="不等于" value="!=" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="阈值" prop="thresholdValue">
            <el-input-number
              v-model="form.thresholdValue"
              :precision="2"
              :step="0.1"
              class="alarm-rule-input-number--left"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="持续时长(秒)" prop="durationSeconds">
            <el-input-number v-model="form.durationSeconds" :min="1" :step="30" style="width: 100%" controls-position="right" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通知通道" prop="notifyChannels">
            <el-select v-model="form.notifyChannels" multiple collapse-tags disabled style="width: 100%">
              <el-option label="邮件" value="EMAIL" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="启用" prop="enabled">
            <el-switch v-model="form.enabled" active-value="1" inactive-value="0" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通知" prop="notifyEnabled">
            <el-switch v-model="form.notifyEnabled" active-value="1" inactive-value="0" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="通知对象" prop="notifyTargets">
        <el-input
          v-model="form.notifyTargets"
          type="textarea"
          :rows="3"
          placeholder="请输入通知对象，逗号/分号/换行分隔；邮件通知请填写邮箱"
          maxlength="512"
        />
      </el-form-item>

      <el-form-item label="规则说明" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入规则说明" maxlength="512" show-word-limit />
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addAlarmRule, getAlarmRule, updateAlarmRule } from '@/api/ems/alarm'
import { listCompany } from '@/api/ems/company'
import { listStation } from '@/api/ems/station'
import { CompanySelector, StationSelector } from '@/components/ems'

function getPayload(response) {
  return response && response.data !== undefined ? response.data : response || {}
}

function getRecords(response) {
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

function createDefaultForm(defaults) {
  return {
    id: undefined,
    companyId: defaults && defaults.companyId !== undefined ? defaults.companyId : undefined,
    stationId: defaults && defaults.stationId !== undefined ? defaults.stationId : 0,
    ruleName: undefined,
    deviceType: 'INVERTER',
    metricKey: undefined,
    conditionOp: '>',
    thresholdValue: undefined,
    durationSeconds: 60,
    severity: 'MEDIUM',
    enabled: '1',
    notifyEnabled: '1',
    notifyChannels: ['EMAIL'],
    notifyTargets: '',
    remark: undefined
  }
}

export default {
  name: 'AlarmRuleFormDialog',
  components: { CompanySelector, StationSelector },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    ruleId: {
      type: [Number, String],
      default: undefined
    },
    defaultCompanyId: {
      type: [Number, String],
      default: undefined
    },
    defaultStationId: {
      type: [Number, String],
      default: undefined
    }
  },
  data() {
    return {
      formLoading: false,
      submitLoading: false,
      companyOptions: [],
      stationOptions: [],
      metricOptions: [
        { label: '逆变器有功功率', value: 'inverter_active_power' },
        { label: '储能变流器有功功率', value: 'pcs_active_power' },
        { label: '储能荷电状态', value: 'storage_soc' },
        { label: '储能健康状态', value: 'storage_soh' },
        { label: '并网点功率', value: 'grid_power' },
        { label: '储能充放电功率', value: 'storage_charge_discharge_power' }
      ],
      form: createDefaultForm(),
      rules: {
        companyId: [
          { required: true, message: '公司不能为空', trigger: 'change' }
        ],
        ruleName: [
          { required: true, message: '规则名称不能为空', trigger: 'blur' }
        ],
        deviceType: [
          { required: true, message: '设备类型不能为空', trigger: 'change' }
        ],
        metricKey: [
          { required: true, message: '监控指标不能为空', trigger: 'change' }
        ],
        conditionOp: [
          { required: true, message: '比较符不能为空', trigger: 'change' }
        ],
        thresholdValue: [
          { required: true, message: '阈值不能为空', trigger: 'change' }
        ],
        durationSeconds: [
          { required: true, message: '持续时长不能为空', trigger: 'change' }
        ],
        severity: [
          { required: true, message: '告警级别不能为空', trigger: 'change' }
        ],
        notifyTargets: [
          { validator: (rule, value, callback) => this.validateNotifyTargets(value, callback), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    },
    title() {
      return this.form.id ? '修改告警' : '新增告警'
    }
  },
  watch: {
    visible(value) {
      if (value) {
        this.openDialog()
      }
    }
  },
  methods: {
    openDialog() {
      const defaults = {
        companyId: this.defaultCompanyId !== undefined && this.defaultCompanyId !== null && this.defaultCompanyId !== ''
          ? Number(this.defaultCompanyId)
          : undefined,
        stationId: this.defaultStationId !== undefined && this.defaultStationId !== null && this.defaultStationId !== ''
          ? Number(this.defaultStationId)
          : 0
      }
      this.form = createDefaultForm(defaults)
      this.loadCompanyOptions()
      if (this.ruleId) {
        this.form.id = Number(this.ruleId)
        this.loadDetail()
      } else {
        this.$nextTick(() => {
          if (this.$refs.form) {
            this.$refs.form.clearValidate()
          }
        })
        this.loadStationOptions()
      }
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = getRecords(response).map(item => ({
          label: item.companyName,
          value: item.companyId
        }))
      }).catch(() => {
        this.companyOptions = []
      })
    },
    loadStationOptions() {
      const query = { pageNum: 1, pageSize: 9999 }
      if (this.form.companyId) {
        query.companyId = this.form.companyId
      }
      listStation(query).then(response => {
        this.stationOptions = getRecords(response).map(item => ({
          label: item.stationName,
          value: item.stationId
        }))
      }).catch(() => {
        this.stationOptions = []
      })
    },
    handleCompanyChange() {
      this.form.stationId = 0
      this.loadStationOptions()
    },
    loadDetail() {
      this.formLoading = true
      getAlarmRule(this.form.id).then(response => {
        const data = getPayload(response)
        this.form = Object.assign({}, createDefaultForm(), data)
        this.form.notifyChannels = ['EMAIL']
        if (!this.form.stationId) {
          this.form.stationId = 0
        }
        this.loadStationOptions()
      }).catch(() => {}).then(() => {
        this.formLoading = false
        this.$nextTick(() => {
          if (this.$refs.form) {
            this.$refs.form.clearValidate()
          }
        })
      })
    },
    validateNotifyTargets(value, callback) {
      if (this.form.notifyEnabled !== '1') {
        callback()
        return
      }
      if (!value || !String(value).trim()) {
        callback(new Error('通知已启用时，邮件接收人不能为空'))
        return
      }
      callback()
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return
        }
        this.submitLoading = true
        const action = this.form.id ? updateAlarmRule : addAlarmRule
        this.form.notifyChannels = ['EMAIL']
        action(this.form).then(() => {
          this.$modal.msgSuccess(this.form.id ? '修改成功' : '新增成功')
          this.dialogVisible = false
          this.$emit('success')
        }).catch(() => {}).then(() => {
          this.submitLoading = false
        })
      })
    },
    handleClosed() {
      this.form = createDefaultForm()
      this.formLoading = false
      this.submitLoading = false
      this.$emit('closed')
    }
  }
}
</script>

<style>
.alarm-rule-form-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.alarm-rule-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.alarm-rule-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.alarm-rule-form-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 24px;
}

.alarm-rule-form-dialog .el-dialog__headerbtn .el-dialog__close {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
}

.alarm-rule-form-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: rgba(0, 0, 0, 0.75);
}

.alarm-rule-form-dialog .el-dialog__body {
  padding: 24px;
  max-height: 70vh;
  overflow: auto;
}

.alarm-rule-form-dialog .el-dialog__footer {
  padding: 12px 24px 16px;
  border-top: 1px solid rgb(240, 240, 240);
}

.alarm-rule-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.alarm-rule-form-dialog .alarm-rule-form .el-form-item {
  margin-bottom: 18px;
}

.alarm-rule-form-dialog .alarm-rule-input-number--left .el-input__inner {
  text-align: left;
}

.alarm-rule-form-dialog .dialog-footer .el-button + .el-button {
  margin-left: 8px;
}

.alarm-rule-form-dialog .dialog-footer .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.alarm-rule-form-dialog .dialog-footer .el-button--primary:hover,
.alarm-rule-form-dialog .dialog-footer .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>
