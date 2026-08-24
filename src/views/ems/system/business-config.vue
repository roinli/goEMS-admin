<template>
  <div class="app-container biz-config-page nco-settings-container">
    <div class="new-style-menu-title">业务参数设置</div>
    <div class="nco-settings-container-content">
      <div class="biz-config-layout">
        <aside class="nco-station-left-tree">
          <div class="tree-searcher">
            <el-input
              v-model="treeFilterText"
              size="small"
              clearable
              placeholder="请输入公司/电站名称"
            />
            <span class="tree-searcher__icon" aria-hidden="true">
              <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" focusable="false">
                <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" />
              </svg>
            </span>
          </div>
          <div class="tree-content-wrapper" v-loading="treeLoading">
            <el-tree
              ref="tree"
              :data="treeData"
              :props="treeProps"
              node-key="key"
              highlight-current
              :expand-on-click-node="false"
              :default-expanded-keys="defaultExpandedKeys"
              :filter-node-method="filterNode"
              empty-text=""
              class="station-tree"
              :class="{ 'is-empty': !treeData.length }"
              @node-click="handleNodeClick"
            >
              <span slot-scope="{ node, data }" class="station-tree__node">
                <img :src="companyIcon" class="station-tree__node-icon" alt="">
                <span class="station-tree__node-label" :title="node.label">{{ data.label }}</span>
              </span>
            </el-tree>
            <div v-if="!treeLoading && !treeData.length" class="station-tree__empty ems-list-table__empty">
              <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
              <p class="ems-list-table__empty-text">暂无公司数据</p>
            </div>
          </div>
        </aside>

        <section class="biz-config-main-panel">
          <div class="biz-config-toolbar">
            <div class="biz-config-toolbar__left">
              <div class="biz-config-title">
                  <el-tag 
                    size="small" 
                    :type="currentNode.type === 'station' ? 'success' : 'primary'"
                    effect="plain"
                    class="biz-config-tag"
                  >
                    {{ currentNode.type === 'station' ? '电站级' : '公司级' }}
                  </el-tag>
                  <span class="biz-config-name">{{ currentNode.label }}</span>
              </div>
            </div>
            <div class="biz-config-toolbar__right">
              <el-button
                type="primary"
                :disabled="!currentNode || !selectedParamKey"
                @click="handleEdit"
                v-hasPermi="['ems:business-config:edit']"
              >修改</el-button>
            </div>
          </div>

          <div class="table-shell">
            <div class="table-shell__wrap">
              <el-table
                v-loading="loading"
                :data="paramRows"
                class="ems-list-table"
                @row-click="handleRowClick"
              >
                <template slot="empty">
                  <div class="ems-list-table__empty">
                    <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                    <p class="ems-list-table__empty-text">暂无数据</p>
                  </div>
                </template>
                <el-table-column width="50" align="center" class-name="biz-config-radio-col">
                  <template slot-scope="scope">
                    <el-radio v-model="selectedParamKey" :label="scope.row.paramKey">&nbsp;</el-radio>
                  </template>
                </el-table-column>
                <el-table-column label="参数名" prop="templateName" min-width="200" :show-overflow-tooltip="true" />
                <el-table-column label="参数值" prop="paramValue" min-width="140" align="center" />
                <el-table-column label="参数单位" prop="unit" width="120" align="center" />
                <el-table-column label="来源" width="120" align="center">
                  <template slot-scope="scope">
                    <el-tag size="mini" :type="scope.row.own ? 'success' : 'info'">
                      {{ scope.row.own ? '本级配置' : '继承默认' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="修改时间" prop="updateTime" width="180" align="center">
                  <template slot-scope="scope">{{ scope.row.updateTime || '-' }}</template>
                </el-table-column>
              </el-table>
            </div>
            <div class="table-footer biz-config-total">
              总计: {{ paramRows.length }}
            </div>
          </div>
        </section>
      </div>
    </div>

    <el-dialog
      title="业务参数设置"
      :visible.sync="open"
      width="520px"
      append-to-body
      custom-class="biz-config-form-dialog"
    >
      <el-form ref="form" v-loading="formLoading" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="参数名">
          <el-input v-model="form.templateName" disabled />
        </el-form-item>
        <el-form-item label="参数值" prop="paramValue">
          <el-input v-model="form.paramValue" placeholder="请输入参数值" maxlength="32" />
        </el-form-item>
        <el-form-item label="参数单位">
          <el-input v-model="form.unit" disabled />
        </el-form-item>
        <el-form-item label="修改时间">
          <el-input v-model="form.updateTime" disabled />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { companyTree } from '@/api/ems/company'
import { listStation } from '@/api/ems/station'
import { getBusinessCoreValues, listBusinessConfig, listBusinessConfigTemplates, saveBusinessConfig } from '@/api/ems/businessConfig'
import companyIcon from '@/assets/images/company.png'
import tableEmptyIcon from '@/assets/images/empty.svg'

export default {
  name: 'EmsSystemBusinessConfig',
  data() {
    return {
      treeLoading: false,
      loading: false,
      formLoading: false,
      treeFilterText: '',
      treeData: [],
      defaultExpandedKeys: [],
      treeProps: { children: 'children', label: 'label' },
      companyIcon,
      tableEmptyIcon,
      templates: [],
      currentNode: null,
      paramRows: [],
      selectedParamKey: '',
      open: false,
      form: {},
      rules: {
        paramValue: [
          { required: true, message: '参数值不能为空', trigger: 'blur' },
          { pattern: /^-?\d+(\.\d+)?$/, message: '参数值必须为数字', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    treeFilterText(value) {
      this.$refs.tree && this.$refs.tree.filter(value)
    }
  },
  created() {
    this.loadTemplates()
    this.loadTree()
  },
  methods: {
    loadTemplates() {
      listBusinessConfigTemplates().then(response => {
        this.templates = response.data || response || []
      }).catch(() => {
        this.templates = []
      })
    },
    loadTree() {
      this.treeLoading = true
      Promise.all([
        companyTree(),
        listStation({ pageNum: 1, pageSize: 9999 })
      ]).then(([treeResponse, stationResponse]) => {
        const companyNodes = treeResponse.data || []
        const stations = stationResponse.data || []
        const stationMap = {}
        stations.forEach(item => {
          const companyId = item.companyId
          if (!stationMap[companyId]) {
            stationMap[companyId] = []
          }
          stationMap[companyId].push({
            key: `station-${item.stationId}`,
            label: item.stationName,
            type: 'station',
            companyId: item.companyId,
            stationId: item.stationId,
            children: []
          })
        })
        this.treeData = this.buildTree(companyNodes, stationMap)
        this.defaultExpandedKeys = this.treeData.map(node => node.key)
        this.treeLoading = false
        this.selectFirstNode()
      }).catch(() => {
        this.treeData = []
        this.treeLoading = false
      })
    },
    buildTree(nodes, stationMap) {
      return (nodes || []).map(node => {
        const companyChildren = this.buildTree(node.children, stationMap)
        const stationChildren = stationMap[node.id] || []
        return {
          key: `company-${node.id}`,
          label: node.label,
          type: 'company',
          companyId: node.id,
          stationId: 0,
          children: companyChildren.concat(stationChildren)
        }
      })
    },
    selectFirstNode() {
      if (this.treeData.length === 0) {
        return
      }
      const first = this.treeData[0]
      this.$nextTick(() => {
        this.$refs.tree && this.$refs.tree.setCurrentKey(first.key)
      })
      this.handleNodeClick(first)
    },
    filterNode(value, data) {
      if (!value) {
        return true
      }
      return (data.label || '').indexOf(value) !== -1
    },
    handleNodeClick(node) {
      this.currentNode = node
      this.loadNodeParams(node)
    },
    handleRowClick(row) {
      this.selectedParamKey = row.paramKey
    },
    loadNodeParams(node) {
      if (!node) {
        this.paramRows = []
        return
      }
      this.loading = true
      const scopeType = node.type === 'station' ? 'STATION' : 'COMPANY'
      const coreQuery = { companyId: node.companyId }
      if (node.stationId) {
        coreQuery.stationId = node.stationId
      }
      const listQuery = {
        pageNum: 1,
        pageSize: 50,
        companyId: node.companyId,
        stationId: node.stationId || 0,
        scopeType
      }
      Promise.all([
        getBusinessCoreValues(coreQuery),
        listBusinessConfig(listQuery)
      ]).then(([coreResponse, listResponse]) => {
        const effective = coreResponse.data || coreResponse || {}
        const ownRecords = listResponse.data || listResponse.rows || []
        const ownMap = {}
        ownRecords.forEach(item => {
          ownMap[item.paramKey] = item
        })
        this.paramRows = this.templates.map(tpl => {
          const own = ownMap[tpl.paramKey]
          const value = own ? own.paramValue : (effective[tpl.paramKey] !== undefined ? effective[tpl.paramKey] : tpl.defaultValue)
          return {
            paramKey: tpl.paramKey,
            templateName: tpl.templateName,
            unit: tpl.unit,
            defaultValue: tpl.defaultValue,
            paramValue: value,
            own: !!own,
            id: own ? own.id : undefined,
            updateTime: own ? own.updateTime : ''
          }
        })
        if (this.paramRows.length && !this.selectedParamKey) {
          this.selectedParamKey = this.paramRows[0].paramKey
        }
        this.loading = false
      }).catch(() => {
        this.paramRows = []
        this.loading = false
      })
    },
    handleEdit() {
      const row = this.paramRows.find(item => item.paramKey === this.selectedParamKey)
      if (!row) {
        return
      }
      this.form = {
        id: row.id,
        paramKey: row.paramKey,
        templateName: row.templateName,
        unit: row.unit,
        paramValue: row.paramValue,
        updateTime: row.updateTime || '-'
      }
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
      this.open = true
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid || !this.currentNode) {
          return
        }
        this.formLoading = true
        const node = this.currentNode
        const payload = {
          id: this.form.id,
          companyId: node.companyId,
          stationId: node.stationId || 0,
          scopeType: node.type === 'station' ? 'STATION' : 'COMPANY',
          paramKey: this.form.paramKey,
          paramValue: this.form.paramValue,
          status: '0'
        }
        saveBusinessConfig(payload).then(() => {
          this.$modal.msgSuccess('修改成功')
          this.open = false
          this.formLoading = false
          this.loadNodeParams(node)
        }).catch(() => {
          this.formLoading = false
        })
      })
    }
  }
}
</script>

<style scoped>
.biz-config-page.nco-settings-container {
  height: calc(100vh - 4rem);
  min-height: calc(100vh - 4rem);
}

.biz-config-page .nco-settings-container-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.biz-config-layout {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  background: #fff;
}

.biz-config-layout::before {
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

.biz-config-main-panel {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  padding: 0.2rem 0 0;
  border: 0;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
}

.biz-config-main-panel ::v-deep .el-table__empty-block {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 100% !important;
  max-width: 100%;
  height: auto !important;
  min-height: 160px;
  box-sizing: border-box;
}

.biz-config-main-panel ::v-deep .biz-config-radio-col .el-radio {
  margin-right: 0;
}

.biz-config-main-panel ::v-deep .biz-config-radio-col .el-radio__label {
  display: none;
}

.biz-config-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.biz-config-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.biz-config-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.biz-config-tag {
  font-weight: 500;
  border-radius: 4px;
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
  font-size: 13px;
}

.biz-config-name {
  font-size: 18px;
  font-weight: 600;
  color: rgba(0,0,0,0.85);
  letter-spacing: 0.5px;
}

.biz-config-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.biz-config-scope {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.biz-config-total {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 32px;
}

@media (max-width: 75rem) {
  .biz-config-layout {
    flex-direction: column;
  }

  .biz-config-layout::before {
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
.biz-config-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.biz-config-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.biz-config-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
