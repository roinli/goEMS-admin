<template>
  <div class="app-container">
    <div class="page-head">
      <div class="page-title">{{ title }}</div>
      <div class="page-actions">
        <el-button size="small" icon="el-icon-back" @click="cancel">返回</el-button>
        <el-button v-if="step > 0" size="small" @click="step--">上一步</el-button>
        <el-button v-if="step < 2" type="primary" size="small" @click="nextStep">下一步</el-button>
        <el-button v-else v-hasPermi="['ems:employee:add', 'ems:employee:edit']" type="primary" size="small" icon="el-icon-check" @click="submitForm">保存</el-button>
      </div>
    </div>

    <el-steps :active="step" align-center finish-status="success" class="steps">
      <el-step title="基础信息" />
      <el-step title="选择角色" />
      <el-step title="关联公司/电站" />
    </el-steps>

    <div v-loading="loading">
      <div v-show="step === 0">
        <el-form ref="baseForm" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="用户名" prop="userName">
                <el-input v-model="form.userName" placeholder="请输入用户名" maxlength="64" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号" prop="phonenumber">
                <el-input v-model="form.phonenumber" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="电子邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入电子邮箱" maxlength="128" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公司" prop="companyId">
                <el-select v-model="form.companyId" placeholder="请选择公司" filterable style="width: 100%" @change="handleCompanyChange">
                  <el-option v-for="item in companyOptions" :key="item.companyId" :label="item.companyName" :value="item.companyId" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio label="0">正常</el-radio>
                  <el-radio label="1">停用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="描述" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入描述" maxlength="200" />
          </el-form-item>
        </el-form>
      </div>

      <div v-show="step === 1">
        <el-form label-width="100px">
          <el-form-item label="角色">
            <el-select v-model="form.roleIds" multiple collapse-tags filterable placeholder="请选择系统角色" style="width: 100%">
              <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="step === 2">
        <el-form label-width="100px">
          <el-form-item label="授权方式">
            <el-radio-group v-model="scopeMode">
              <el-radio label="COMPANY">公司</el-radio>
              <el-radio label="STATION">电站</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="scopeMode === 'COMPANY'" label="公司范围">
            <el-select v-model="scopeCompanyIds" multiple filterable collapse-tags placeholder="选择公司" style="width: 100%">
              <el-option v-for="item in companyOptions" :key="item.companyId" :label="item.companyName" :value="item.companyId" />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="电站范围">
            <el-select v-model="scopeStationIds" multiple filterable collapse-tags placeholder="选择电站" style="width: 100%">
              <el-option v-for="item in stationOptions" :key="item.stationId" :label="item.stationName" :value="item.stationId" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { listCompany } from '@/api/ems/company'
import { addEmployee, getEmployee, listEmployeeRoleOptions, updateEmployee } from '@/api/ems/employee'
import { listStation } from '@/api/ems/station'

const DEFAULT_EMPLOYEE_PASSWORD = '123456'

export default {
  name: 'EmsSystemEmployeeEdit',
  data() {
    return {
      loading: false,
      title: '新增员工',
      step: 0,
      companyOptions: [],
      roleOptions: [],
      stationOptions: [],
      scopeMode: 'COMPANY',
      scopeCompanyIds: [],
      scopeStationIds: [],
      form: {},
      rules: {
        companyId: [{ required: true, message: '公司不能为空', trigger: 'change' }],
        userName: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
        phonenumber: [{ required: true, message: '手机号不能为空', trigger: 'blur' }],
        email: [{ type: 'email', message: '电子邮箱格式不正确', trigger: ['blur', 'change'] }]
      }
    }
  },
  computed: {
    userId() {
      return this.$route.query.userId ? Number(this.$route.query.userId) : undefined
    }
  },
  created() {
    this.reset()
    this.loadCompanyOptions()
    this.loadRoleOptions()
    if (this.userId) {
      this.title = '修改员工'
      this.loadDetail(this.userId)
    }
  },
  methods: {
    reset() {
      const defaultCompanyId = this.$route.query.companyId ? Number(this.$route.query.companyId) : undefined
      this.form = {
        userId: undefined,
        companyId: defaultCompanyId,
        userName: undefined,
        phonenumber: undefined,
        email: undefined,
        status: '0',
        remark: undefined,
        roleIds: []
      }
      this.scopeMode = 'COMPANY'
      this.scopeCompanyIds = defaultCompanyId ? [defaultCompanyId] : []
      this.scopeStationIds = []
      this.step = 0
      this.resetForm('baseForm')
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = response.data || []
        if (this.form.companyId) {
          this.loadStationOptions(this.form.companyId)
        }
      }).catch(() => {})
    },
    loadRoleOptions() {
      listEmployeeRoleOptions().then(response => {
        this.roleOptions = response.data || []
      })
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
    loadDetail(userId) {
      this.loading = true
      getEmployee(userId).then(response => {
        const data = response.data || response || {}
        this.form = Object.assign({}, this.form, data, {
          roleIds: Array.isArray(data.roleIds) ? data.roleIds.slice() : []
        })
        this.scopeMode = data.scopeMode || 'COMPANY'
        this.scopeCompanyIds = Array.isArray(data.scopeCompanyIds) ? data.scopeCompanyIds.slice() : []
        this.scopeStationIds = Array.isArray(data.scopeStationIds) ? data.scopeStationIds.slice() : []
        if (this.form.companyId) {
          this.loadStationOptions(this.form.companyId)
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleCompanyChange(companyId) {
      this.scopeStationIds = []
      if (this.scopeMode === 'COMPANY') {
        this.scopeCompanyIds = companyId ? [companyId] : []
      }
      this.loadStationOptions(companyId)
    },
    nextStep() {
      if (this.step === 0) {
        this.$refs['baseForm'].validate(valid => {
          if (valid) {
            this.step += 1
          }
        })
        return
      }
      this.step += 1
    },
    submitForm() {
      this.$refs['baseForm'].validate(valid => {
        if (!valid) {
          this.step = 0
          return
        }
        if (!Array.isArray(this.form.roleIds) || !this.form.roleIds.length) {
          this.step = 1
          this.$modal.msgError('至少选择一个系统角色')
          return
        }
        if (this.scopeMode === 'COMPANY' && (!this.scopeCompanyIds || !this.scopeCompanyIds.length)) {
          this.$modal.msgError('请选择公司范围')
          return
        }
        if (this.scopeMode === 'STATION' && (!this.scopeStationIds || !this.scopeStationIds.length)) {
          this.$modal.msgError('请选择电站范围')
          return
        }
        this.loading = true
        const payload = Object.assign({}, this.form, {
          scopeMode: this.scopeMode,
          scopeCompanyIds: this.scopeMode === 'COMPANY' ? this.scopeCompanyIds : [],
          scopeStationIds: this.scopeMode === 'STATION' ? this.scopeStationIds : []
        })
        const action = this.form.userId ? updateEmployee : addEmployee
        const isCreate = !this.form.userId
        action(payload).then(() => {
          this.$modal.msgSuccess(isCreate ? `新增成功，默认密码：${DEFAULT_EMPLOYEE_PASSWORD}` : '修改成功')
          this.loading = false
          this.cancel()
        }).catch(() => {
          this.loading = false
        })
      })
    },
    cancel() {
      this.$router.push({ path: '/ems-system/employee' })
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

.steps {
  margin-bottom: 24px;
}
</style>
