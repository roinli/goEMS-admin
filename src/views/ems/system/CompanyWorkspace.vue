<template>
  <div class="app-container company-page nco-settings-container">
    <div class="company-page-header">
      <div class="new-style-menu-title">公司管理</div>
      <div class="company-page-header__actions">
        <el-button
          type="primary"
          @click="openCompanyDialogForAdd"
          v-hasPermi="['ems:company:add']"
        >新增公司</el-button>
        <el-button
          plain
          :disabled="!selectedCompanyId"
          @click="handleDeleteCompany"
          v-hasPermi="['ems:company:remove']"
        >删除公司</el-button>
      </div>
    </div>
    <div class="nco-settings-container-content">
      <div class="company-layout">
        <aside class="nco-station-left-tree">
          <div class="tree-searcher">
            <el-input
              v-model="treeFilterText"
              size="small"
              clearable
              placeholder="请输入公司名"
            />
            <span class="tree-searcher__icon" aria-hidden="true">
              <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" focusable="false">
                <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" />
              </svg>
            </span>
          </div>
          <div class="tree-content-wrapper" v-loading="treeLoading">
            <el-tree
              ref="companyTree"
              :data="filteredTreeOptions"
              :props="treeProps"
              node-key="id"
              highlight-current
              default-expand-all
              :current-node-key="currentTreeKey"
              :expand-on-click-node="false"
              empty-text=""
              class="station-tree"
              :class="{ 'is-empty': !filteredTreeOptions.length }"
              @node-click="handleTreeNodeClick"
            >
              <span slot-scope="{ node }" class="station-tree__node">
                <img :src="companyIcon" class="station-tree__node-icon" alt="">
                <span class="station-tree__node-label" :title="node.label">{{ node.label }}</span>
              </span>
            </el-tree>
            <div v-if="!treeLoading && !filteredTreeOptions.length" class="station-tree__empty ems-list-table__empty">
              <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
              <p class="ems-list-table__empty-text">暂无公司数据</p>
            </div>
          </div>
        </aside>

        <section class="company-main-panel">
          <!--
          <div class="company-toolbar company-toolbar--top">
            <div class="company-toolbar__left" />
            <div class="company-toolbar__right">
              <el-select
                v-model="selectedTenantId"
                size="small"
                filterable
                :disabled="!isAdmin"
                placeholder="选择安装商"
                class="company-tenant-select"
                @change="handleTenantChange"
              >
                <el-option
                  v-for="item in tenantOptions"
                  :key="item.tenantId"
                  :label="item.tenantName"
                  :value="item.tenantId"
                />
              </el-select>
              <el-button plain @click="handleRefresh">刷新</el-button>
            </div>
          </div>
          -->

          <el-tabs v-model="activeTab" class="workspace-tabs" @tab-click="handleTabClick">
            <el-tab-pane label="用户管理" name="users">
              <div class="tab-panel">
                <el-form
                  ref="employeeQueryForm"
                  :model="employeeQuery"
                  size="small"
                  :inline="true"
                  label-width="90px"
                  class="ems-list-search"
                  @submit.native.prevent
                >
                  <el-form-item label="用户名" prop="userName">
                    <el-input
                      v-model="employeeQuery.userName"
                      placeholder="请输入用户名"
                      clearable
                      class="ems-list-search__control"
                      @keyup.enter.native="handleEmployeeQuery"
                    />
                  </el-form-item>
                  <el-form-item label="手机号" prop="phonenumber">
                    <el-input
                      v-model="employeeQuery.phonenumber"
                      placeholder="请输入手机号"
                      clearable
                      class="ems-list-search__control"
                      @keyup.enter.native="handleEmployeeQuery"
                    />
                  </el-form-item>
                  <el-form-item label="邮箱" prop="email">
                    <el-input
                      v-model="employeeQuery.email"
                      placeholder="请输入电子邮箱"
                      clearable
                      class="ems-list-search__control"
                      @keyup.enter.native="handleEmployeeQuery"
                    />
                  </el-form-item>
                  <el-form-item class="ems-list-search__actions">
                    <el-button type="text" class="expand-trigger" @click="showEmployeeAdvanced = !showEmployeeAdvanced">
                      {{ showEmployeeAdvanced ? '收起' : '展开' }}
                      <i :class="showEmployeeAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
                    </el-button>
                    <el-button type="primary" @click="handleEmployeeQuery">查询</el-button>
                    <el-button @click="resetEmployeeQuery">重置</el-button>
                  </el-form-item>
                </el-form>

                <el-form
                  v-show="showEmployeeAdvanced"
                  :model="employeeQuery"
                  size="small"
                  :inline="true"
                  label-width="90px"
                  class="ems-list-search ems-list-search--advanced"
                  @submit.native.prevent
                >
                  <el-form-item label="角色" prop="roleId">
                    <el-select
                      v-model="employeeQuery.roleId"
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
                  <el-form-item label="状态" prop="status">
                    <el-select
                      v-model="employeeQuery.status"
                      placeholder="员工状态"
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

                <div class="company-divider" role="separator" />

                <div class="company-toolbar">
                  <div class="company-toolbar__left" />
                  <div class="company-toolbar__right">
                    <el-button
                      plain
                      @click="handleEmployeeExport"
                      v-hasPermi="['ems:employee:export']"
                    >导出</el-button>
                    <el-button
                      type="primary"
                      @click="handleEmployeeAdd"
                      v-hasPermi="['ems:employee:add']"
                    >新增</el-button>
                  </div>
                </div>

                <div class="table-shell">
                  <div class="table-shell__wrap">
                    <el-table v-loading="employeeLoading" :data="employeeList" class="ems-list-table">
                      <template slot="empty">
                        <div class="ems-list-table__empty">
                          <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                          <p class="ems-list-table__empty-text">暂无数据</p>
                        </div>
                      </template>
                      <el-table-column label="用户名" align="center" prop="userName" min-width="140" />
                      <el-table-column label="手机号" align="center" prop="phonenumber" min-width="140" />
                      <el-table-column label="电子邮箱" align="center" prop="email" min-width="200" :show-overflow-tooltip="true" />
                      <el-table-column label="公司" align="center" prop="companyName" min-width="180" :show-overflow-tooltip="true" />
                      <el-table-column label="角色" align="center" prop="roleNames" min-width="180" :show-overflow-tooltip="true">
                        <template slot-scope="scope">
                          <span>{{ scope.row.roleNames || '--' }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="状态" align="center" prop="status" width="100">
                        <template slot-scope="scope">
                          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status" />
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
                          <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                            <el-button
                              type="text"
                              icon="el-icon-edit"
                              class="ems-list-table__ops-btn"
                              @click="handleEmployeeUpdate(scope.row)"
                              v-hasPermi="['ems:employee:edit']"
                            />
                          </el-tooltip>
                          <el-tooltip content="重置密码" placement="top" effect="light" popper-class="ems-list-tooltip">
                            <el-button
                              type="text"
                              icon="el-icon-key"
                              class="ems-list-table__ops-btn"
                              @click="handleEmployeeResetPwd(scope.row)"
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
                              @click="handleEmployeeToggleStatus(scope.row)"
                              v-hasPermi="['ems:employee:edit']"
                            />
                          </el-tooltip>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  <div class="table-footer">
                    <pagination
                      v-show="employeeTotal > 0"
                      :total="employeeTotal"
                      :page.sync="employeeQuery.pageNum"
                      :limit.sync="employeeQuery.pageSize"
                      @pagination="loadEmployees"
                    />
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="公司信息配置" name="info">
              <div v-loading="companyFormLoading" class="tab-panel">
                <el-empty v-if="!selectedCompanyId" description="请选择左侧公司" />
                <el-form v-else ref="companyInfoForm" :model="companyForm" :rules="companyRules" label-width="110px" class="company-config-form">
                  <company-form-fields
                    :form="companyForm"
                    :parent-options="parentCompanyOptions"
                    :dict-options="dict.type.sys_normal_disable"
                    @pick-location="openLocationPicker('info')"
                  />
                  <div class="card-actions">
                    <el-button
                      type="primary"
                      @click="submitCompanyInfo"
                      v-hasPermi="['ems:company:edit']"
                    >保存</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>

            <el-tab-pane label="公司邮箱配置" name="mail">
              <div class="tab-panel">
                <el-empty v-if="!selectedCompanyId" description="请选择左侧公司" />
                <el-form v-else ref="mailForm" v-loading="mailLoading" :model="mailForm" :rules="mailRules" label-width="110px" class="company-config-form">
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-form-item label="所属公司">
                        <el-input :value="selectedCompanyName" disabled />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="邮件服务器" prop="smtpHost">
                        <el-input v-model="mailForm.smtpHost" placeholder="请输入邮件服务器地址" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-form-item label="端口" prop="smtpPort">
                        <el-input-number
                          v-model="mailForm.smtpPort"
                          :min="1"
                          :max="65535"
                          class="mail-config-input-number--left"
                          controls-position="right"
                          style="width: 100%"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="邮件账号" prop="smtpUsername">
                        <el-input v-model="mailForm.smtpUsername" placeholder="请输入邮件账号" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-form-item label="邮件密码" prop="smtpPassword">
                        <el-input v-model="mailForm.smtpPassword" type="password" show-password autocomplete="new-password" placeholder="编辑时留空则保持不变" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="发件邮箱" prop="fromAddress">
                        <el-input v-model="mailForm.fromAddress" placeholder="请输入发件邮箱" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-form-item label="发件名称" prop="fromName">
                        <el-input v-model="mailForm.fromName" placeholder="请输入发件名称" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="配置状态" prop="enabled">
                        <el-radio-group v-model="mailForm.enabled">
                          <el-radio label="1">启用</el-radio>
                          <el-radio label="0">停用</el-radio>
                        </el-radio-group>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <el-form-item label="邮件认证" prop="authEnabled">
                        <el-switch v-model="mailForm.authEnabled" active-value="1" inactive-value="0" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="加密连接" prop="sslEnabled">
                        <el-switch v-model="mailForm.sslEnabled" active-value="1" inactive-value="0" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="安全升级加密" prop="starttlsEnabled">
                        <el-switch v-model="mailForm.starttlsEnabled" active-value="1" inactive-value="0" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="mailForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
                  </el-form-item>
                  <div class="card-actions">
                    <el-button
                      v-if="mailForm.id"
                      plain
                      @click="handleDeleteMail"
                      v-hasPermi="['ems:alarm:mail-config:remove']"
                    >删除配置</el-button>
                    <el-button
                      type="primary"
                      @click="submitMailForm"
                      v-hasPermi="['ems:alarm:mail-config:add', 'ems:alarm:mail-config:edit']"
                    >保存</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </section>
      </div>
    </div>

    <el-dialog
      :title="companyDialogTitle"
      :visible.sync="companyDialogVisible"
      width="860px"
      append-to-body
      custom-class="company-form-dialog"
    >
      <el-form ref="companyDialogForm" :model="companyDialogForm" :rules="companyRules" label-width="110px">
        <company-form-fields
          :form="companyDialogForm"
          :parent-options="parentCompanyOptions"
          :dict-options="dict.type.sys_normal_disable"
          @pick-location="openLocationPicker('dialog')"
        />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="companyDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitCompanyDialog">确 定</el-button>
      </div>
    </el-dialog>

    <amap-location-picker-dialog
      :visible.sync="mapDialogVisible"
      :map-config="mapConfig"
      :initial-address="locationTargetForm.address"
      :initial-longitude="locationTargetForm.longitude"
      :initial-latitude="locationTargetForm.latitude"
      @confirm="handleLocationConfirm"
    />

    <employee-form-dialog
      :visible.sync="employeeFormDialogVisible"
      :user-id="employeeFormDialogUserId"
      :default-company-id="employeeFormDialogCompanyId"
      @success="loadEmployees"
    />
  </div>
</template>

<script>
import { addCompany, companyTree, delCompany, getCompany, listCompany, updateCompany } from '@/api/ems/company'
import { changeEmployeeStatus, exportEmployee, listEmployee, listEmployeeRoleOptions } from '@/api/ems/employee'
import { addAlarmMailConfig, delAlarmMailConfig, listAlarmMailConfigs, updateAlarmMailConfig } from '@/api/ems/alarm'
import { getInfo } from '@/api/login'
import { listTenant } from '@/api/system/tenant'
import { getMapConfig } from '@/api/ems/map'
import { getTenant, setTenant } from '@/utils/auth'
import { AmapLocationPickerDialog } from '@/components/ems'
import CompanyFormFields from './components/CompanyFormFields.vue'
import EmployeeFormDialog from './components/EmployeeFormDialog.vue'
import companyIcon from '@/assets/images/company.png'
import tableEmptyIcon from '@/assets/images/empty.svg'

function parseTenantId(value) {
  if (!value && value !== 0) {
    return undefined
  }
  const tenantId = Number(value)
  return Number.isNaN(tenantId) ? undefined : tenantId
}

function getPayload(response) {
  return response && response.data !== undefined ? response.data : response || {}
}

function getRecords(response) {
  const payload = getPayload(response)
  if (Array.isArray(payload)) {
    return payload
  }
  return payload.rows || payload.records || payload.list || []
}

export default {
  name: 'CompanyWorkspace',
  components: { CompanyFormFields, AmapLocationPickerDialog, EmployeeFormDialog },
  props: {
    initialTab: {
      type: String,
      default: 'users'
    },
    initialCompanyId: {
      type: [String, Number],
      default: undefined
    }
  },
  dicts: ['sys_normal_disable'],
  data() {
    const companyId = this.initialCompanyId ? Number(this.initialCompanyId) : undefined
    return {
      treeLoading: false,
      companyFormLoading: false,
      employeeLoading: false,
      mailLoading: false,
      showEmployeeAdvanced: false,
      activeTab: this.normalizeInitialTab(this.initialTab),
      selectedCompanyId: companyId,
      selectedTenantId: parseTenantId(getTenant()),
      isAdmin: false,
      treeFilterText: '',
      companyIcon,
      tableEmptyIcon,
      mapDialogVisible: false,
      locationTarget: 'info',
      mapConfig: {},
      tenantOptions: [],
      treeOptions: [],
      companyOptions: [],
      parentCompanyOptions: [],
      roleOptions: [],
      companyForm: this.createCompanyForm(companyId ? { companyId } : {}),
      companyDialogVisible: false,
      companyDialogTitle: '新增公司',
      companyDialogForm: this.createCompanyForm(),
      employeeFormDialogVisible: false,
      employeeFormDialogUserId: undefined,
      employeeFormDialogCompanyId: undefined,
      employeeList: [],
      employeeTotal: 0,
      employeeQuery: {
        pageNum: 1,
        pageSize: 10,
        userName: undefined,
        phonenumber: undefined,
        email: undefined,
        companyId,
        roleId: undefined,
        status: undefined
      },
      mailForm: this.createMailForm(companyId),
      companyRules: {
        companyName: [{ required: true, message: '公司名称不能为空', trigger: 'blur' }]
      },
      mailRules: {
        smtpHost: [{ required: true, message: '邮件服务器不能为空', trigger: 'blur' }],
        smtpPort: [{ required: true, message: '端口不能为空', trigger: 'change' }],
        fromAddress: [{ required: true, message: '发件邮箱不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    treeProps() {
      return { children: 'children', label: 'label' }
    },
    currentTreeKey() {
      return this.selectedCompanyId || 'all'
    },
    filteredTreeOptions() {
      const nodes = [{ id: 'all', label: '全部范围', children: this.treeOptions }]
      const keyword = (this.treeFilterText || '').trim().toLowerCase()
      if (!keyword) {
        return nodes
      }
      return this.filterTree(nodes, keyword)
    },
    selectedCompanyName() {
      if (!this.selectedCompanyId) {
        return '全部范围'
      }
      const option = this.companyOptions.find(item => item.companyId === this.selectedCompanyId)
      return option ? option.companyName : (this.companyForm.companyName || String(this.selectedCompanyId))
    },
    locationTargetForm() {
      return this.locationTarget === 'dialog' ? this.companyDialogForm : this.companyForm
    }
  },
  created() {
    this.isAdmin = Array.isArray(this.$store.getters.roles) && this.$store.getters.roles.includes('admin')
    this.loadMapConfig()
    this.loadTenantOptions().then(() => {
      this.loadTree()
      this.loadCompanyOptions()
      this.loadRoleOptions()
      this.loadEmployees()
      if (this.selectedCompanyId) {
        this.loadCompanyInfo(this.selectedCompanyId)
        this.loadMailConfig()
      }
    })
  },
  methods: {
    normalizeInitialTab(tab) {
      return tab === 'list' || tab === 'form' ? 'info' : (tab || 'users')
    },
    createCompanyForm(seed = {}) {
      return Object.assign({
        companyId: undefined,
        companyName: undefined,
        parentId: null,
        companyDesc: undefined,
        country: undefined,
        province: undefined,
        city: undefined,
        address: undefined,
        longitude: undefined,
        latitude: undefined,
        website: undefined,
        recordNo: undefined,
        status: '0',
        remark: undefined
      }, seed)
    },
    createMailForm(companyId) {
      return {
        id: undefined,
        companyId: companyId || 0,
        smtpHost: '',
        smtpPort: 25,
        smtpUsername: '',
        smtpPassword: '',
        fromAddress: '',
        fromName: '',
        sslEnabled: '0',
        starttlsEnabled: '0',
        authEnabled: '1',
        enabled: '1',
        remark: ''
      }
    },
    loadMapConfig() {
      getMapConfig().then(response => {
        this.mapConfig = response.data || response || {}
      }).catch(() => {})
    },
    loadTenantOptions() {
      if (!this.isAdmin) {
        const currentTenantId = parseTenantId(getTenant())
        this.selectedTenantId = currentTenantId
        const syncCurrentTenant = (tenantName) => {
          this.tenantOptions = currentTenantId === undefined ? [] : [{ tenantId: currentTenantId, tenantName: tenantName || `租户-${currentTenantId}` }]
        }
        return getInfo().then(response => {
          syncCurrentTenant(response.tenantName || (response.user && response.user.tenantName))
        }).catch(() => {
          syncCurrentTenant()
        })
      }
      return listTenant({ pageNum: 1, pageSize: 9999 }).then(response => {
        const rows = getRecords(response)
        const excluded = new Set([9999])
        this.tenantOptions = rows.map(item => ({
          tenantId: parseTenantId(item.id || item.tenantId),
          tenantName: item.tenantName || item.tenant_name || `租户-${item.id || item.tenantId}`
        })).filter(item => item.tenantId !== undefined && !excluded.has(item.tenantId))
        const matched = this.tenantOptions.find(item => item.tenantId === this.selectedTenantId)
        if (!matched && this.tenantOptions.length) {
          this.selectedTenantId = this.tenantOptions[0].tenantId
          setTenant(String(this.selectedTenantId))
        }
      }).catch(() => {})
    },
    loadTree() {
      this.treeLoading = true
      return companyTree().then(response => {
        this.treeOptions = response.data || []
        this.parentCompanyOptions = this.cloneTree(this.treeOptions)
        this.$nextTick(() => this.syncTreeSelection())
      }).catch(() => {
        this.treeOptions = []
      }).then(() => {
        this.treeLoading = false
      })
    },
    loadCompanyOptions() {
      return listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = getRecords(response)
      }).catch(() => {
        this.companyOptions = []
      })
    },
    loadRoleOptions() {
      listEmployeeRoleOptions().then(response => {
        this.roleOptions = response.data || []
      }).catch(() => {
        this.roleOptions = []
      })
    },
    syncTreeSelection() {
      if (this.$refs.companyTree) {
        this.$refs.companyTree.setCurrentKey(this.currentTreeKey)
      }
    },
    handleTenantChange(tenantId) {
      if (!tenantId) {
        return
      }
      setTenant(String(tenantId))
      this.selectedCompanyId = undefined
      this.employeeQuery.companyId = undefined
      this.companyForm = this.createCompanyForm()
      this.mailForm = this.createMailForm()
      this.loadTree()
      this.loadCompanyOptions()
      this.loadEmployees()
    },
    handleTreeNodeClick(data) {
      const companyId = data && data.id && data.id !== 'all' ? Number(data.id) : undefined
      this.selectedCompanyId = companyId
      this.employeeQuery.companyId = companyId
      this.employeeQuery.pageNum = 1
      if (companyId) {
        this.loadCompanyInfo(companyId)
        this.loadMailConfig()
      } else {
        this.companyForm = this.createCompanyForm()
        this.mailForm = this.createMailForm()
      }
      this.loadEmployees()
    },
    handleTabClick(tab) {
      if (tab.name === 'users') {
        this.loadEmployees()
      }
      if (tab.name === 'mail' && this.selectedCompanyId) {
        this.loadMailConfig()
      }
      if (tab.name === 'info' && this.selectedCompanyId) {
        this.loadCompanyInfo(this.selectedCompanyId)
      }
    },
    loadCompanyInfo(companyId) {
      if (!companyId) {
        this.companyForm = this.createCompanyForm()
        return
      }
      this.companyFormLoading = true
      getCompany(companyId).then(response => {
        const data = Object.assign({}, getPayload(response))
        if (!data.parentId || data.parentId === 0) {
          data.parentId = null
        }
        this.companyForm = this.createCompanyForm(data)
        this.parentCompanyOptions = this.excludeCompanyNode(this.cloneTree(this.treeOptions), data.companyId)
      }).catch(() => {}).then(() => {
        this.companyFormLoading = false
      })
    },
    submitCompanyInfo() {
      this.$refs.companyInfoForm.validate(valid => {
        if (!valid) {
          return
        }
        this.companyFormLoading = true
        const payload = Object.assign({}, this.companyForm, { parentId: this.companyForm.parentId || 0 })
        updateCompany(payload).then(() => {
          this.$modal.msgSuccess('保存成功')
          return Promise.all([this.loadTree(), this.loadCompanyOptions()])
        }).then(() => {
          this.loadCompanyInfo(this.selectedCompanyId)
        }).catch(() => {}).then(() => {
          this.companyFormLoading = false
        })
      })
    },
    openCompanyDialogForAdd() {
      this.companyDialogTitle = '新增公司'
      this.companyDialogForm = this.createCompanyForm({ parentId: this.selectedCompanyId || null })
      this.parentCompanyOptions = this.cloneTree(this.treeOptions)
      this.companyDialogVisible = true
      this.$nextTick(() => this.resetForm('companyDialogForm'))
    },
    submitCompanyDialog() {
      this.$refs.companyDialogForm.validate(valid => {
        if (!valid) {
          return
        }
        const payload = Object.assign({}, this.companyDialogForm, { parentId: this.companyDialogForm.parentId || 0 })
        addCompany(payload).then(response => {
          const saved = getPayload(response)
          this.$modal.msgSuccess('新增成功')
          this.companyDialogVisible = false
          this.selectedCompanyId = saved.companyId || this.selectedCompanyId
          this.employeeQuery.companyId = this.selectedCompanyId
          return Promise.all([this.loadTree(), this.loadCompanyOptions()])
        }).then(() => {
          if (this.selectedCompanyId) {
            this.loadCompanyInfo(this.selectedCompanyId)
            this.loadEmployees()
          }
        }).catch(() => {})
      })
    },
    handleDeleteCompany() {
      if (!this.selectedCompanyId) {
        return
      }
      this.$modal.confirm(`是否确认删除公司 "${this.selectedCompanyName}"？`).then(() => {
        return delCompany(this.selectedCompanyId)
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.selectedCompanyId = undefined
        this.employeeQuery.companyId = undefined
        this.companyForm = this.createCompanyForm()
        this.mailForm = this.createMailForm()
        return Promise.all([this.loadTree(), this.loadCompanyOptions(), this.loadEmployees()])
      }).catch(() => {})
    },
    openLocationPicker(target) {
      this.locationTarget = target
      this.mapDialogVisible = true
    },
    handleLocationConfirm(location) {
      const target = this.locationTargetForm
      this.$set(target, 'address', location.address || '')
      this.$set(target, 'longitude', location.longitude !== undefined && location.longitude !== null ? Number(location.longitude) : undefined)
      this.$set(target, 'latitude', location.latitude !== undefined && location.latitude !== null ? Number(location.latitude) : undefined)
      this.mapDialogVisible = false
    },
    loadEmployees() {
      this.employeeLoading = true
      return listEmployee(this.employeeQuery).then(response => {
        this.employeeList = response.data || []
        this.employeeTotal = response.total || 0
      }).catch(() => {
        this.employeeList = []
        this.employeeTotal = 0
      }).then(() => {
        this.employeeLoading = false
      })
    },
    handleEmployeeQuery() {
      this.employeeQuery.pageNum = 1
      this.loadEmployees()
    },
    resetEmployeeQuery() {
      const companyId = this.selectedCompanyId
      this.resetForm('employeeQueryForm')
      this.employeeQuery.companyId = companyId
      this.employeeQuery.pageNum = 1
      this.loadEmployees()
    },
    handleEmployeeAdd() {
      this.employeeFormDialogUserId = undefined
      this.employeeFormDialogCompanyId = this.selectedCompanyId
      this.employeeFormDialogVisible = true
    },
    handleEmployeeUpdate(row) {
      if (!row || !row.userId) {
        return
      }
      this.employeeFormDialogUserId = row.userId
      this.employeeFormDialogCompanyId = undefined
      this.employeeFormDialogVisible = true
    },
    handleEmployeeResetPwd(row) {
      if (!row || !row.userId) {
        return
      }
      this.$router.push({ path: '/ems-system/employee-password', query: { userId: row.userId }})
    },
    handleEmployeeToggleStatus(row) {
      const nextStatus = row.status === '0' ? '1' : '0'
      const label = nextStatus === '0' ? '启用' : '停用'
      this.$modal.confirm(`是否确认${label}员工 "${row.userName}"？`).then(() => {
        return changeEmployeeStatus(row.userId, nextStatus)
      }).then(() => {
        this.$modal.msgSuccess(`${label}成功`)
        this.loadEmployees()
      }).catch(() => {})
    },
    handleEmployeeExport() {
      exportEmployee(this.employeeQuery)
    },
    loadMailConfig() {
      if (!this.selectedCompanyId) {
        this.mailForm = this.createMailForm()
        return Promise.resolve()
      }
      this.mailLoading = true
      return listAlarmMailConfigs({ pageNum: 1, pageSize: 9999, companyId: this.selectedCompanyId }).then(response => {
        const config = getRecords(response)[0]
        if (config) {
          this.mailForm = Object.assign({}, this.createMailForm(this.selectedCompanyId), config, { smtpPassword: '' })
        } else {
          this.mailForm = this.createMailForm(this.selectedCompanyId)
        }
      }).catch(() => {
        this.mailForm = this.createMailForm(this.selectedCompanyId)
      }).then(() => {
        this.mailLoading = false
      })
    },
    submitMailForm() {
      this.$refs.mailForm.validate(valid => {
        if (!valid) {
          return
        }
        const payload = Object.assign({}, this.mailForm, { companyId: this.selectedCompanyId })
        const request = payload.id ? updateAlarmMailConfig(payload) : addAlarmMailConfig(payload)
        request.then(() => {
          this.$modal.msgSuccess('保存成功')
          this.loadMailConfig()
        })
      })
    },
    handleDeleteMail() {
      if (!this.mailForm.id) {
        return
      }
      this.$modal.confirm(`是否确认删除公司 "${this.selectedCompanyName}" 的邮箱配置？`).then(() => {
        return delAlarmMailConfig(this.mailForm.id)
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.loadMailConfig()
      }).catch(() => {})
    },
    handleRefresh() {
      this.loadTree()
      this.loadCompanyOptions()
      this.loadEmployees()
      if (this.selectedCompanyId) {
        this.loadCompanyInfo(this.selectedCompanyId)
        this.loadMailConfig()
      }
    },
    cloneTree(nodes) {
      return (nodes || []).map(node => {
        const next = Object.assign({}, node)
        if (next.children && next.children.length) {
          next.children = this.cloneTree(next.children)
        }
        return next
      })
    },
    excludeCompanyNode(nodes, companyId) {
      return (nodes || []).reduce((result, node) => {
        if (node.id === companyId) {
          return result
        }
        const next = Object.assign({}, node)
        if (next.children && next.children.length) {
          next.children = this.excludeCompanyNode(next.children, companyId)
          if (!next.children.length) {
            delete next.children
          }
        }
        result.push(next)
        return result
      }, [])
    },
    filterTree(nodes, keyword) {
      return (nodes || []).reduce((result, node) => {
        const label = String(node.label || '').toLowerCase()
        const children = node.children ? this.filterTree(node.children, keyword) : []
        if (label.includes(keyword) || children.length) {
          const next = Object.assign({}, node)
          if (children.length) {
            next.children = children
          }
          result.push(next)
        }
        return result
      }, [])
    }
  }
}
</script>

<style scoped>
.company-page.nco-settings-container {
  height: calc(100vh - 4rem);
  min-height: calc(100vh - 4rem);
}

.company-page .nco-settings-container-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.company-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0;
}

.company-page-header .new-style-menu-title {
  margin-bottom: 0;
}

.company-page-header__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.company-page-header__actions .el-button + .el-button {
  margin-left: 1rem;
}

.company-layout {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  background: #fff;
}

.company-layout::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 17.5rem;
  z-index: 1;
  width: 1px;
  background: #e8e8e8;
  transform: scaleX(0.5);
  transform-origin: center;
  pointer-events: none;
}

.nco-station-left-tree {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 17.5rem;
  width: 17.5rem;
  min-width: 17.5rem;
  max-width: 17.5rem;
  align-self: stretch;
  min-height: 0;
  margin-right: 1.25rem;
  padding: 0 0.5rem 0 0;
  border: 0;
  background: #fff;
}

.nco-station-left-tree .tree-searcher {
  position: relative;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner {
  height: 2rem;
  line-height: 2rem;
  padding-right: 2rem;
  border: 0;
  border-radius: 0.25rem;
  background: rgb(243, 243, 243);
  box-shadow: none;
  color: rgba(0, 0, 0, 0.85);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner::placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner::-webkit-input-placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner::-moz-placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner:hover,
.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner:focus {
  background: rgb(243, 243, 243);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__suffix {
  right: 1.75rem;
}

.nco-station-left-tree .tree-searcher__icon {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-top: -0.5rem;
  color: rgba(0, 0, 0, 0.85);
  pointer-events: none;
}

.nco-station-left-tree .tree-searcher__icon svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.nco-station-left-tree .tree-content-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0.5rem 0 0;
  overflow: auto;
}

.nco-station-left-tree .station-tree {
  background: #fff;
}

.nco-station-left-tree .station-tree.is-empty ::v-deep .el-tree__empty-block {
  display: none;
}

.nco-station-left-tree .station-tree__empty {
  padding-top: 2.5rem;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__content {
  height: 2rem;
  color: rgba(0, 0, 0, 0.85);
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__expand-icon {
  color: rgba(0, 0, 0, 0.85);
  font-size: 12px;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__expand-icon.is-leaf {
  color: transparent !important;
  cursor: default;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__content:hover {
  background: #f5f5f5;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content {
  background: #0a59f7;
  color: #fff;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content .el-tree-node__expand-icon:not(.is-leaf) {
  color: #fff;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content .station-tree__node-icon {
  filter: brightness(0) invert(1);
}

.station-tree__node {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.station-tree__node-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.35rem;
  flex-shrink: 0;
  object-fit: contain;
}

.station-tree__node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-main-panel {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
}

.company-tenant-select {
  width: 240px;
}

.company-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.company-toolbar--top {
  margin-bottom: 12px;
}

.company-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.company-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
  gap: 0;
}

.company-toolbar__right .el-button + .el-button,
.company-toolbar__right .company-tenant-select + .el-button {
  margin-left: 1rem;
}

.company-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.company-page .ems-list-search--advanced {
  margin-top: 12px;
}

.company-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.company-page .ems-list-search__control {
  width: 11rem;
}

.company-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.company-page .expand-trigger:hover,
.company-page .expand-trigger:focus {
  color: #0747c7;
}

.company-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.company-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.workspace-tabs {
  background: #fff;
}

.workspace-tabs >>> .el-tabs__header {
  margin: 0 0 16px;
  border-bottom: 1px solid #e5e5e5;
}

.workspace-tabs >>> .el-tabs__nav-wrap::after {
  display: none;
}

.workspace-tabs >>> .el-tabs__nav {
  border: none;
}

.workspace-tabs >>> .el-tabs__item {
  position: relative;
  height: 44px;
  line-height: 44px;
  padding: 0;
  margin-right: 32px;
  font-size: 16px;
  font-weight: 400;
  color: rgb(102, 102, 102);
  border: none !important;
  background: transparent !important;
}

.workspace-tabs >>> .el-tabs__item:last-child {
  margin-right: 0;
}

.workspace-tabs >>> .el-tabs__item:hover {
  color: #0a59f7;
}

.workspace-tabs >>> .el-tabs__item.is-active {
  color: #0a59f7;
  font-weight: 500;
}

/* 用伪元素画下划线，避免 el-tabs active-bar 改字号/间距后错位 */
.workspace-tabs >>> .el-tabs__active-bar {
  display: none;
}

.workspace-tabs >>> .el-tabs__item.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background-color: #0a59f7;
  border-radius: 1px;
}

.tab-panel {
  padding: 8px 2px 2px;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 1280px) {
  .company-layout {
    flex-direction: column;
  }

  .company-layout::before {
    display: none;
  }

  .nco-station-left-tree {
    flex: none;
    width: 100%;
    min-width: 0;
    max-width: none;
    min-height: auto;
    margin-right: 0;
    margin-bottom: 1rem;
    padding-right: 0;
    border-bottom: 1px solid #d1d1d1;
  }

  .nco-station-left-tree .tree-content-wrapper {
    max-height: 16rem;
  }
}
</style>

<style>
.company-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.company-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.company-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.company-config-form .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.company-config-form .mail-config-input-number--left .el-input__inner {
  text-align: left;
}
</style>
