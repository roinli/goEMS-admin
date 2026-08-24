<template>
  <div class="app-container employee-page nco-settings-container">
    <div class="new-style-menu-title">员工管理</div>
    <div class="nco-settings-container-content">
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
          <el-select
            v-model="queryParams.companyId"
            placeholder="请选择公司"
            clearable
            filterable
            class="ems-list-search__control"
          >
            <el-option
              v-for="item in companyOptions"
              :key="item.companyId"
              :label="item.companyName"
              :value="item.companyId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入用户名"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phonenumber">
          <el-input
            v-model="queryParams.phonenumber"
            placeholder="请输入手机号"
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
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="queryParams.email"
            placeholder="请输入电子邮箱"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select
            v-model="queryParams.roleId"
            placeholder="请选择角色"
            clearable
            filterable
            class="ems-list-search__control"
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.roleId"
              :label="item.roleName"
              :value="item.roleId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="员工状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择员工状态"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="employee-divider" role="separator" />

      <div class="employee-toolbar">
        <div class="employee-toolbar__left">
          <span class="employee-toolbar__tenant-label">当前租户</span>
          <tenant-selector
            v-model="tenantId"
            class="employee-toolbar__tenant-select"
            @change="handleTenantChange"
          />
        </div>
        <div class="employee-toolbar__right">
          <el-button
            plain
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['ems:employee:edit']"
          >修改</el-button>
          <el-button
            plain
            :disabled="single"
            @click="handleResetPwd"
            v-hasPermi="['ems:employee:resetPwd']"
          >重置密码</el-button>
          <el-button
            plain
            :disabled="single"
            @click="handleToggleStatus"
            v-hasPermi="['ems:employee:edit']"
          >启停</el-button>
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['ems:employee:export']"
          >导出</el-button>
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['ems:employee:remove']"
          >删除</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['ems:employee:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="employeeList"
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
            <el-table-column label="用户名" align="center" prop="userName" min-width="140" />
            <el-table-column label="手机号" align="center" prop="phonenumber" min-width="140" />
            <el-table-column label="电子邮箱" align="center" prop="email" min-width="200" :show-overflow-tooltip="true" />
            <el-table-column label="公司" align="center" prop="companyName" min-width="180" />
            <el-table-column label="角色" align="center" prop="roleNames" min-width="180" :show-overflow-tooltip="true">
              <template slot-scope="scope">
                <span>{{ scope.row.roleNames || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据范围" align="center" min-width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.scopeSummary || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="备注" align="center" prop="remark" min-width="180" :show-overflow-tooltip="true" />
            <el-table-column
              label="操作"
              align="center"
              width="140"
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
                    v-hasPermi="['ems:employee:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="重置密码" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-key"
                    class="ems-list-table__ops-btn"
                    @click="handleResetPwd(scope.row)"
                    v-hasPermi="['ems:employee:resetPwd']"
                  />
                </el-tooltip>
                <el-tooltip
                  :content="scope.row.status === '0' ? '停用' : '启用'"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-switch-button"
                    class="ems-list-table__ops-btn"
                    @click="handleToggleStatus(scope.row)"
                    v-hasPermi="['ems:employee:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['ems:employee:remove']"
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

    <employee-form-dialog
      :visible.sync="formDialogVisible"
      :user-id="formDialogUserId"
      :default-company-id="formDialogCompanyId"
      @success="getList"
    />
  </div>
</template>

<script>
import { listCompany } from '@/api/ems/company'
import { changeEmployeeStatus, delEmployee, exportEmployee, listEmployee, listEmployeeRoleOptions } from '@/api/ems/employee'
import { TenantSelector } from '@/components/ems'
import { getTenant } from '@/utils/auth'
import tableEmptyIcon from '@/assets/images/empty.svg'
import EmployeeFormDialog from './components/EmployeeFormDialog.vue'

export default {
  name: 'EmsSystemEmployee',
  components: { EmployeeFormDialog, TenantSelector },
  dicts: ['sys_normal_disable'],
  data() {
    return {
      loading: true,
      tenantId: getTenant() ? Number(getTenant()) : undefined,
      showAdvanced: false,
      total: 0,
      employeeList: [],
      companyOptions: [],
      roleOptions: [],
      ids: [],
      single: true,
      multiple: true,
      tableEmptyIcon,
      formDialogVisible: false,
      formDialogUserId: undefined,
      formDialogCompanyId: undefined,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: undefined,
        phonenumber: undefined,
        email: undefined,
        companyId: undefined,
        roleId: undefined,
        status: undefined
      }
    }
  },
  created() {
    this.loadCompanyOptions()
    this.loadRoleOptions()
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      return listEmployee(this.queryParams).then(response => {
        this.employeeList = response.data || []
        this.total = response.total || 0
      }).catch(() => {
        this.employeeList = []
        this.total = 0
      }).finally(() => {
        this.loading = false
      })
    },
    loadCompanyOptions() {
      return listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = response.data || []
      })
    },
    loadRoleOptions() {
      return listEmployeeRoleOptions().then(response => {
        this.roleOptions = response.data || []
      })
    },
    handleTenantChange() {
      this.queryParams.pageNum = 1
      this.queryParams.companyId = undefined
      this.queryParams.roleId = undefined
      this.ids = []
      this.single = true
      this.multiple = true
      return Promise.all([
        this.loadCompanyOptions(),
        this.loadRoleOptions()
      ]).then(() => this.getList())
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.formDialogUserId = undefined
      this.formDialogCompanyId = this.queryParams.companyId
      this.formDialogVisible = true
    },
    handleUpdate(row) {
      const userId = (row && row.userId) || this.ids[0]
      if (!userId) {
        return
      }
      this.formDialogUserId = userId
      this.formDialogCompanyId = undefined
      this.formDialogVisible = true
    },
    handleResetPwd(row) {
      const userId = row && row.userId ? row.userId : this.ids[0]
      if (!userId) {
        return
      }
      this.$router.push({ path: '/ems-system/employee-password', query: { userId: userId }})
    },
    handleToggleStatus(row) {
      const target = row || (this.ids.length ? this.employeeList.find(item => item.userId === this.ids[0]) : null)
      if (!target) {
        return
      }
      const nextStatus = target.status === '0' ? '1' : '0'
      const label = nextStatus === '0' ? '启用' : '停用'
      this.$modal.confirm(`是否确认${label}员工 "${target.userName}"？`).then(() => {
        return changeEmployeeStatus(target.userId, nextStatus)
      }).then(() => {
        this.$modal.msgSuccess(`${label}成功`)
        this.getList()
      }).catch(() => {})
    },
    handleDelete(row) {
      const userIds = row && row.userId ? [row.userId] : this.ids
      if (!userIds.length) {
        return
      }
      this.$modal.confirm('是否确认删除选中的员工数据项？').then(() => Promise.all(userIds.map(id => delEmployee(id)))).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleExport() {
      exportEmployee(this.queryParams)
    }
  }
}
</script>

<style scoped>
.employee-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.employee-page .ems-list-search--advanced {
  margin-top: 12px;
}

.employee-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.employee-page .ems-list-search__control {
  width: 11rem;
}

.employee-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.employee-page .expand-trigger:hover,
.employee-page .expand-trigger:focus {
  color: #0747c7;
}

.employee-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.employee-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.employee-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.employee-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-toolbar__tenant-label {
  flex: 0 0 auto;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.employee-toolbar__tenant-select {
  width: 220px;
}

.employee-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.employee-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}
</style>
