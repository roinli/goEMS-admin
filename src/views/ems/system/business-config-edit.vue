<template>
  <div class="app-container">
    <div class="page-head">
      <div class="page-title">{{ title }}</div>
      <div class="page-actions">
        <el-button size="small" icon="el-icon-back" @click="cancel">返回</el-button>
        <el-button v-hasPermi="['ems:business-config:add', 'ems:business-config:edit']" type="primary" size="small" icon="el-icon-check" @click="submitForm">保存</el-button>
      </div>
    </div>

    <el-form ref="form" v-loading="loading" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="核心模板">
            <el-select v-model="selectedTemplateKey" clearable filterable placeholder="可选核心模板" style="width: 100%" @change="handleTemplateChange">
              <el-option v-for="item in templateOptions" :key="item.paramKey" :label="item.templateName" :value="item.paramKey" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="作用域" prop="scopeType">
            <el-select v-model="form.scopeType" placeholder="请选择作用域" style="width: 100%" @change="handleScopeChange">
              <el-option label="租户级" value="TENANT" />
              <el-option label="公司级" value="COMPANY" />
              <el-option label="电站级" value="STATION" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="公司" prop="companyId">
            <el-select v-model="form.companyId" :disabled="form.scopeType === 'TENANT'" placeholder="请选择公司" filterable style="width: 100%" @change="handleCompanyChange">
              <el-option v-for="item in companyOptions" :key="item.companyId" :label="item.companyName" :value="item.companyId" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电站" prop="stationId">
            <el-select v-model="form.stationId" placeholder="请选择电站" filterable style="width: 100%" :disabled="form.scopeType !== 'STATION'">
              <el-option v-for="item in stationOptions" :key="item.stationId" :label="item.stationName" :value="item.stationId" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="参数键" prop="paramKey">
            <el-input v-model="form.paramKey" placeholder="请输入参数键" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="值类型" prop="valueType">
            <el-select v-model="form.valueType" :disabled="Boolean(currentTemplate)" placeholder="请选择值类型" style="width: 100%">
              <el-option label="文本" value="STRING" />
              <el-option label="数值" value="NUMBER" />
              <el-option label="开关" value="BOOLEAN" />
              <el-option label="结构化对象" value="JSON" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="参数值" prop="paramValue">
            <el-input v-model="form.paramValue" placeholder="请输入参数值" maxlength="1024" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio label="0">启用</el-radio>
              <el-radio label="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-alert
        v-if="currentTemplate"
        :title="`${currentTemplate.templateName}，默认值 ${currentTemplate.defaultValue}`"
        :description="`${currentTemplate.description}；允许作用域：${scopeTypeListText(currentTemplate.scopeTypes)}`"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <div v-if="currentTemplate" class="effective-card">
        <div class="effective-card__title">当前生效值预览</div>
        <div class="effective-card__meta">优先级：电站级 > 公司级 > 租户级 > 模板默认值</div>
        <div class="effective-card__grid">
          <div class="effective-card__item">
            <span>当前生效值</span>
            <strong>{{ effectivePreview.value }}</strong>
          </div>
          <div class="effective-card__item">
            <span>生效来源</span>
            <strong>{{ effectivePreview.sourceText }}</strong>
          </div>
          <div class="effective-card__item effective-card__item--wide">
            <span>保存后预计覆盖</span>
            <strong>{{ pendingOverrideText }}</strong>
          </div>
        </div>
      </div>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="512" show-word-limit />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { listCompany } from '@/api/ems/company'
import { getBusinessConfig, getBusinessCoreValues, listBusinessConfigTemplates, saveBusinessConfig } from '@/api/ems/businessConfig'
import { listStation } from '@/api/ems/station'

export default {
  name: 'EmsSystemBusinessConfigEdit',
  data() {
    const validateCompany = (rule, value, callback) => {
      if (this.form.scopeType !== 'TENANT' && !value) {
        callback(new Error('公司不能为空'))
        return
      }
      callback()
    }
    const validateStation = (rule, value, callback) => {
      if (this.form.scopeType === 'STATION' && !value) {
        callback(new Error('电站不能为空'))
        return
      }
      callback()
    }
    return {
      loading: false,
      title: '新增业务参数',
      companyOptions: [],
      stationOptions: [],
      templateOptions: [],
      effectiveValues: {},
      selectedTemplateKey: undefined,
      form: {},
      rules: {
        companyId: [{ validator: validateCompany, trigger: 'change' }],
        stationId: [{ validator: validateStation, trigger: 'change' }],
        paramKey: [{ required: true, message: '参数键不能为空', trigger: 'blur' }],
        paramValue: [{ required: true, message: '参数值不能为空', trigger: 'blur' }],
        valueType: [{ required: true, message: '值类型不能为空', trigger: 'change' }],
        scopeType: [{ required: true, message: '作用域不能为空', trigger: 'change' }]
      }
    }
  },
  computed: {
    id() {
      return this.$route.query.id ? Number(this.$route.query.id) : undefined
    },
    currentTemplate() {
      return this.templateOptions.find(item => item.paramKey === this.form.paramKey) || null
    },
    effectivePreview() {
      if (!this.currentTemplate) {
        return {
          value: '--',
          sourceText: '--'
        }
      }
      const value = this.effectiveValues[this.currentTemplate.paramKey]
      return {
        value: value !== undefined && value !== null && value !== '' ? value : this.currentTemplate.defaultValue,
        sourceText: this.buildEffectiveSourceText()
      }
    },
    pendingOverrideText() {
      if (!this.currentTemplate) {
        return '--'
      }
      const scopeMap = {
        TENANT: '租户级',
        COMPANY: '公司级',
        STATION: '电站级'
      }
      return `${scopeMap[this.form.scopeType] || this.form.scopeType} ${this.form.paramKey || ''}`.trim()
    }
  },
  watch: {
    'form.companyId'() {
      this.loadEffectiveValues()
    },
    'form.stationId'() {
      this.loadEffectiveValues()
    },
    'form.scopeType'() {
      this.loadEffectiveValues()
    },
    'form.paramKey'() {
      this.loadEffectiveValues()
    }
  },
  created() {
    this.reset()
    this.loadCompanyOptions()
    this.loadTemplates()
    if (this.id) {
      this.title = '修改业务参数'
      this.loadDetail(this.id)
    }
  },
  methods: {
    reset() {
      this.form = {
        id: undefined,
        companyId: this.$route.query.companyId ? Number(this.$route.query.companyId) : undefined,
        stationId: undefined,
        paramKey: undefined,
        paramValue: undefined,
        valueType: 'STRING',
        scopeType: 'TENANT',
        status: '0',
        remark: undefined
      }
      this.resetForm('form')
    },
    loadTemplates() {
      listBusinessConfigTemplates().then(response => {
        this.templateOptions = response.data || response || []
        this.loadEffectiveValues()
      }).catch(() => {
        this.templateOptions = []
      })
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = response.data || []
        if (this.form.companyId) {
          this.loadStationOptions(this.form.companyId)
        }
      }).catch(() => {})
    },
    loadStationOptions(companyId) {
      if (!companyId) {
        this.stationOptions = []
        return
      }
      listStation({ pageNum: 1, pageSize: 9999, companyId }).then(response => {
        this.stationOptions = response.data || []
      })
    },
    loadDetail(id) {
      this.loading = true
      getBusinessConfig(id).then(response => {
        this.form = Object.assign({}, this.form, response.data || response || {})
        this.selectedTemplateKey = this.form.paramKey
        if (this.form.companyId) {
          this.loadStationOptions(this.form.companyId)
        }
        this.loadEffectiveValues()
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleCompanyChange(companyId) {
      this.loadStationOptions(companyId)
      if (this.form.scopeType !== 'STATION') {
        this.form.stationId = undefined
      }
    },
    handleScopeChange(scopeType) {
      if (scopeType === 'TENANT') {
        this.form.companyId = undefined
        this.form.stationId = undefined
        return
      }
      if (scopeType === 'COMPANY') {
        this.form.stationId = undefined
      }
      if (this.form.companyId) {
        this.loadStationOptions(this.form.companyId)
      }
    },
    handleTemplateChange(paramKey) {
      const template = this.templateOptions.find(item => item.paramKey === paramKey)
      if (!template) {
        return
      }
      this.form.paramKey = template.paramKey
      this.form.valueType = template.valueType
      if (this.form.paramValue === undefined || this.form.paramValue === null || this.form.paramValue === '') {
        this.form.paramValue = template.defaultValue
      }
      if (!(template.scopeTypes || []).includes(this.form.scopeType)) {
        this.form.scopeType = template.scopeTypes[0] || 'TENANT'
        this.handleScopeChange(this.form.scopeType)
      }
    },
    buildEffectiveSourceText() {
      if (this.form.scopeType === 'STATION' && this.form.stationId) {
        const station = this.stationOptions.find(item => item.stationId === this.form.stationId)
        return `当前站点${station ? '：' + station.stationName : ''}`
      }
      if (this.form.scopeType === 'COMPANY' && this.form.companyId) {
        const company = this.companyOptions.find(item => item.companyId === this.form.companyId)
        return `当前公司${company ? '：' + company.companyName : ''}`
      }
      return '当前租户'
    },
    scopeTypeListText(values) {
      const map = {
        TENANT: '租户级',
        COMPANY: '公司级',
        STATION: '电站级'
      }
      return (values || []).map(item => map[item] || item).join(' / ')
    },
    loadEffectiveValues() {
      if (!this.currentTemplate && !this.form.paramKey) {
        return
      }
      const query = {}
      if (this.form.companyId) {
        query.companyId = this.form.companyId
      }
      if (this.form.stationId && this.form.scopeType === 'STATION') {
        query.stationId = this.form.stationId
      }
      getBusinessCoreValues(query).then(response => {
        this.effectiveValues = response.data || response || {}
      }).catch(() => {
        this.effectiveValues = {}
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) {
          return
        }
        this.loading = true
        saveBusinessConfig(this.form).then(() => {
          this.$modal.msgSuccess(this.form.id ? '修改成功' : '新增成功')
          this.loading = false
          this.cancel()
        }).catch(() => {
          this.loading = false
        })
      })
    },
    cancel() {
      this.$router.push({ path: '/ems-system/business-config' })
    }
  }
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.effective-card {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #e6eef8;
  border-radius: 8px;
  background: #f8fbff;
}

.effective-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #22324a;
}

.effective-card__meta {
  margin-top: 6px;
  color: #76859a;
  font-size: 12px;
}

.effective-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.effective-card__item {
  padding: 12px;
  border-radius: 6px;
  background: #ffffff;
}

.effective-card__item--wide {
  grid-column: span 1;
}

.effective-card__item span {
  display: block;
  margin-bottom: 6px;
  color: #76859a;
  font-size: 12px;
}

.effective-card__item strong {
  color: #22324a;
  font-size: 14px;
  word-break: break-all;
}

@media (max-width: 992px) {
  .effective-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
