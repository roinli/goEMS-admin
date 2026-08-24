<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="960px"
    append-to-body
    :close-on-click-modal="false"
    custom-class="nco-user-management-add-modal employee-form-dialog"
    @closed="handleClosed"
  >
    <div class="nco-wizard">
      <div class="nco-wizard-steps">
        <template v-for="(item, index) in steps">
          <div
            :key="'step-' + index"
            class="nco-wizard-steps__item"
            :class="{
              'is-active': step === index,
              'is-done': step > index
            }"
          >
            <span class="nco-wizard-steps__dot" />
            <span class="nco-wizard-steps__label">{{ item }}</span>
          </div>
          <div
            v-if="index < steps.length - 1"
            :key="'line-' + index"
            class="nco-wizard-steps__line"
            :class="{ 'is-active': step > index }"
          />
        </template>
      </div>

      <div v-loading="loading" class="nco-wizard-body">
        <div v-show="step === 0" class="nco-wizard-pane">
          <el-form ref="baseForm" :model="form" :rules="rules" label-width="100px" class="nco-wizard-form">
            <el-form-item label="用户名" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名" maxlength="64" />
            </el-form-item>
            <el-form-item label="手机号" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入电子邮箱" maxlength="128" />
            </el-form-item>
            <el-form-item label="所属公司" prop="companyId">
              <el-select
                v-model="form.companyId"
                placeholder="请选择公司"
                filterable
                style="width: 100%"
                @change="handleCompanyChange"
              >
                <el-option
                  v-for="item in companyOptions"
                  :key="item.companyId"
                  :label="item.companyName"
                  :value="item.companyId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="0">正常</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="描述" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入描述" maxlength="200" />
            </el-form-item>
          </el-form>
        </div>

        <div v-show="step === 1" class="nco-wizard-pane">
          <div class="table-shell nco-wizard-role-table">
            <div class="table-shell__wrap">
              <el-table
                ref="roleTable"
                :data="roleOptions"
                class="ems-list-table"
                height="360"
                @selection-change="handleRoleSelectionChange"
              >
                <template slot="empty">
                  <div class="ems-list-table__empty">
                    <p class="ems-list-table__empty-text">暂无角色数据</p>
                  </div>
                </template>
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column label="角色名称" prop="roleName" min-width="160" :show-overflow-tooltip="true" />
                <el-table-column label="描述" prop="remark" min-width="260" :show-overflow-tooltip="true">
                  <template slot-scope="scope">
                    <span>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <div v-show="step === 2" class="nco-wizard-pane">
          <el-form label-width="100px" class="nco-wizard-form">
            <el-form-item label="授权方式">
              <el-radio-group v-model="scopeMode">
                <el-radio label="COMPANY">公司</el-radio>
                <el-radio label="STATION">电站</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="scopeMode === 'COMPANY'" label="公司范围">
              <el-select
                v-model="scopeCompanyIds"
                multiple
                filterable
                collapse-tags
                placeholder="选择公司"
                style="width: 100%"
              >
                <el-option
                  v-for="item in companyOptions"
                  :key="item.companyId"
                  :label="item.companyName"
                  :value="item.companyId"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-else label="电站范围">
              <el-select
                v-model="scopeStationIds"
                multiple
                filterable
                collapse-tags
                placeholder="选择电站"
                style="width: 100%"
              >
                <el-option
                  v-for="item in stationOptions"
                  :key="item.stationId"
                  :label="item.stationName"
                  :value="item.stationId"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <div slot="footer" class="dialog-footer nco-wizard-footer">
      <el-button class="nco-wizard-action-btn" @click="close">取 消</el-button>
      <el-button v-if="step > 0" class="nco-wizard-action-btn" @click="step--">上一步</el-button>
      <el-button
        v-if="step < 2"
        class="nco-wizard-action-btn"
        @click="nextStep"
      >下一步</el-button>
      <el-button
        v-else
        type="primary"
        :loading="loading"
        v-hasPermi="['ems:employee:add', 'ems:employee:edit']"
        @click="submitForm"
      >确 认</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listCompany } from '@/api/ems/company'
import { addEmployee, getEmployee, listEmployeeRoleOptions, updateEmployee } from '@/api/ems/employee'
import { listStation } from '@/api/ems/station'

const DEFAULT_EMPLOYEE_PASSWORD = '123456'

export default {
  name: 'EmployeeFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    userId: {
      type: [Number, String],
      default: undefined
    },
    defaultCompanyId: {
      type: [Number, String],
      default: undefined
    }
  },
  data() {
    return {
      loading: false,
      title: '新增',
      step: 0,
      steps: ['基础信息', '选择角色', '关联公司/电站'],
      companyOptions: [],
      roleOptions: [],
      stationOptions: [],
      scopeMode: 'COMPANY',
      scopeCompanyIds: [],
      scopeStationIds: [],
      syncingRoleSelection: false,
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
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.openDialog()
      }
    },
    step(val) {
      if (val === 1) {
        this.$nextTick(() => this.syncRoleTableSelection())
      }
    }
  },
  methods: {
    openDialog() {
      this.reset()
      this.loadCompanyOptions()
      this.loadRoleOptions()
      if (this.userId) {
        this.title = '修改'
        this.loadDetail(this.userId)
      } else {
        this.title = '新增'
      }
    },
    reset() {
      const defaultCompanyId = this.defaultCompanyId ? Number(this.defaultCompanyId) : undefined
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
      this.$nextTick(() => {
        this.$refs.baseForm && this.$refs.baseForm.clearValidate()
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
    loadRoleOptions() {
      listEmployeeRoleOptions().then(response => {
        this.roleOptions = response.data || []
        this.$nextTick(() => this.syncRoleTableSelection())
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
        this.$nextTick(() => this.syncRoleTableSelection())
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    syncRoleTableSelection() {
      const table = this.$refs.roleTable
      if (!table || !this.roleOptions.length) {
        return
      }
      this.syncingRoleSelection = true
      table.clearSelection()
      const selected = new Set((this.form.roleIds || []).map(id => Number(id)))
      this.roleOptions.forEach(row => {
        if (selected.has(Number(row.roleId))) {
          table.toggleRowSelection(row, true)
        }
      })
      this.$nextTick(() => {
        this.syncingRoleSelection = false
      })
    },
    handleRoleSelectionChange(selection) {
      if (this.syncingRoleSelection) {
        return
      }
      this.form.roleIds = selection.map(item => item.roleId)
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
        this.$refs.baseForm.validate(valid => {
          if (valid) {
            this.step += 1
          }
        })
        return
      }
      this.step += 1
    },
    submitForm() {
      this.$refs.baseForm.validate(valid => {
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
          this.$emit('success')
          this.close()
        }).catch(() => {
          this.loading = false
        })
      })
    },
    close() {
      this.dialogVisible = false
    },
    handleClosed() {
      this.step = 0
      this.$emit('closed')
    }
  }
}
</script>

<style>
.nco-user-management-add-modal.employee-form-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.nco-user-management-add-modal.employee-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.nco-user-management-add-modal.employee-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.nco-user-management-add-modal.employee-form-dialog .el-dialog__body {
  padding: 24px 32px 8px;
}

.nco-user-management-add-modal.employee-form-dialog .el-dialog__footer {
  padding: 12px 24px 16px;
  border-top: 1px solid rgb(240, 240, 240);
}

.nco-user-management-add-modal.employee-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.nco-wizard-steps {
  display: flex;
  align-items: flex-start;
  margin: 8px 96px 36px;
  min-height: 48px;
}

.nco-wizard-steps__item {
  position: relative;
  z-index: 1;
  flex: 0 0 8px;
  width: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nco-wizard-steps__line {
  flex: 1 1 auto;
  height: 2px;
  margin-top: 3px;
  margin-left: 4px;
  margin-right: 4px;
  background: #e5e5e5;
  align-self: flex-start;
}

.nco-wizard-steps__line.is-active {
  background: #0a59f7;
}

.nco-wizard-steps__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: 0;
  box-shadow: none;
}

.nco-wizard-steps__item.is-active .nco-wizard-steps__dot,
.nco-wizard-steps__item.is-done .nco-wizard-steps__dot {
  background: #0a59f7;
}

.nco-wizard-steps__label {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #111a2ce6;
  line-height: 1.4;
  white-space: nowrap;
}

.nco-wizard-steps__item.is-active .nco-wizard-steps__label,
.nco-wizard-steps__item.is-done .nco-wizard-steps__label {
  color: #0a59f7;
}

.nco-wizard-body {
  min-height: 360px;
}

.nco-wizard-form {
  max-width: 560px;
  margin: 0 auto;
}

.nco-wizard-role-table {
  margin-top: 4px;
}

.nco-wizard-footer .el-button + .el-button {
  margin-left: 12px;
}

.nco-wizard-action-btn {
  color: rgba(0, 0, 0, 0.85);
  background: #fff;
  border-color: #dcdfe6;
}

.nco-wizard-action-btn:hover,
.nco-wizard-action-btn:focus,
.nco-wizard-action-btn:active {
  color: #0a59f7;
  background: #fff;
  border-color: #0a59f7;
}
</style>
