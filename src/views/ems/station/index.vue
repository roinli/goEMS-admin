<template>
  <div class="app-container station-page nco-settings-container">
    <div class="new-style-menu-title">电站管理</div>
    <div class="nco-settings-container-content">
    <div class="station-layout">
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
            node-key="id"
            :props="treeProps"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            empty-text=""
            class="station-tree"
            :class="{ 'is-empty': !filteredTreeOptions.length }"
            @node-click="handleCompanyTreeClick"
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

      <section class="station-main-panel">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="90px" class="ems-list-search" @submit.native.prevent>
          <el-form-item label="电站名称" prop="stationName">
            <el-input
              v-model="queryParams.stationName"
              placeholder="请输入电站名称"
              clearable
              class="ems-list-search__control"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="电站编码" prop="stationCode">
            <el-input
              v-model="queryParams.stationCode"
              placeholder="请输入电站编码"
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
          <el-form-item label="电站状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="电站状态" clearable class="ems-list-search__control">
              <el-option label="正常" value="NORMAL" />
              <el-option label="停用" value="DISABLED" />
              <el-option label="建设中" value="CONSTRUCTION" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="station-divider" role="separator"></div>

        <div class="station-toolbar">
          <div class="station-toolbar__left">
            <div class="station-kpis">
              <el-tooltip
                v-for="item in stationKpiItems"
                :key="item.key"
                :content="item.label"
                placement="top"
                effect="light"
                popper-class="ems-list-tooltip"
              >
                <div class="station-kpi-tag">
                  <svg class="station-kpi-tag__icon" :style="{ color: item.color }" viewBox="64 64 896 896" focusable="false" aria-hidden="true">
                    <path fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 232c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V296zm32 440a48.01 48.01 0 010-96 48.01 48.01 0 010 96z" />
                  </svg>
                  <span class="station-kpi-tag__num">{{ item.value }}</span>
                </div>
              </el-tooltip>
            </div>
          </div>
          <div class="station-toolbar__right">
            <el-button plain @click="handleExport" v-hasPermi="['ems:station:export']">导出</el-button>
            <el-button type="primary" @click="handleAdd" v-hasPermi="['ems:station:add']">新建电站</el-button>
          </div>
        </div>

        <div class="table-shell">
          <div class="table-shell__wrap">
            <el-table v-loading="loading" :data="stationList" class="ems-list-table" @selection-change="handleSelectionChange">
              <template slot="empty">
                <div class="ems-list-table__empty">
                  <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                  <p class="ems-list-table__empty-text">暂无数据</p>
                </div>
              </template>
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column label="公司" align="center" prop="companyName" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="电站名称" align="center" prop="stationName" min-width="180" :show-overflow-tooltip="true" />
              <el-table-column label="电站编码" align="center" prop="stationCode" min-width="160" :show-overflow-tooltip="true" />
              <el-table-column label="类型" align="center" prop="stationType" width="110">
                <template slot-scope="scope">
                  <span>{{ stationTypeText(scope.row.stationType) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="国家/地区" align="center" prop="country" width="120" />
              <el-table-column label="联系人" align="center" prop="contactName" width="120" />
              <el-table-column label="联系电话" align="center" prop="contactPhone" width="140" />
              <el-table-column label="运行模式" align="center" prop="runMode" width="140">
                <template slot-scope="scope">
                  <span>{{ runModeText(scope.row.runMode) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="容量(kW)" align="center" prop="capacityKw" width="120" />
              <el-table-column label="状态" align="center" prop="status" width="110">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="statusTagType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="260" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
                <template slot-scope="scope">
                  <el-tooltip content="监控" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <el-button type="text" icon="el-icon-data-analysis" class="ems-list-table__ops-btn" @click="handleMonitor(scope.row)" v-hasPermi="['ems:monitor:overview']" />
                  </el-tooltip>
                  <el-tooltip content="告警" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <el-button type="text" icon="el-icon-warning-outline" class="ems-list-table__ops-btn" @click="handleAlarm(scope.row)" v-hasPermi="['ems:alarm:history']" />
                  </el-tooltip>
                  <el-tooltip content="详情" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <el-button type="text" icon="el-icon-view" class="ems-list-table__ops-btn" @click="handleDetail(scope.row)" v-hasPermi="['ems:station:list']" />
                  </el-tooltip>
                  <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <el-button type="text" icon="el-icon-edit" class="ems-list-table__ops-btn" @click="handleUpdate(scope.row)" v-hasPermi="['ems:station:edit']" />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                    <el-button type="text" icon="el-icon-delete" class="ems-list-table__ops-btn" @click="handleDelete(scope.row)" v-hasPermi="['ems:station:remove']" />
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
      </section>
    </div>
    </div>
  </div>
</template>

<script>
import { companyTree, listCompany } from "@/api/ems/company";
import { delStation, exportStation, listStation } from "@/api/ems/station";
import { parseTime } from "@/utils/witos";
import { CompanySelector } from "@/components/ems";
import companyIcon from "@/assets/images/company.png";
import tableEmptyIcon from "@/assets/images/empty.svg";

export default {
  name: "EmsStationIndex",
  components: { CompanySelector },
  data() {
    return {
      loading: true,
      showAdvanced: false,
      total: 0,
      stationList: [],
      companyOptions: [],
      treeLoading: false,
      treeFilterText: '',
      treeOptions: [],
      companyIcon,
      tableEmptyIcon,
      ids: [],
      multiple: true,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        tenantId: undefined,
        companyId: undefined,
        stationName: undefined,
        stationCode: undefined,
        status: undefined
      }
    };
  },
  created() {
    this.applyRouteQuery();
    this.loadCompanyOptions();
    this.getList();
  },
  watch: {
    '$route.query': {
      deep: true,
      handler() {
        this.applyRouteQuery();
        this.syncTreeSelection();
        this.getList();
      }
    }
  },
  computed: {
    treeProps() {
      return {
        children: 'children',
        label: 'label'
      };
    },
    filteredTreeOptions() {
      const keyword = (this.treeFilterText || '').trim().toLowerCase();
      const nodes = this.treeOptions || [];
      if (!keyword) {
        return nodes;
      }
      return this.filterTree(nodes, keyword);
    },
    stationKpiItems() {
      return [
        { key: 'total', label: '电站总数', value: this.total, color: '#ffbb33' },
        { key: 'NORMAL', label: '正常电站', value: this.statusCount('NORMAL'), color: '#01CB76' },
        { key: 'DISABLED', label: '停用电站', value: this.statusCount('DISABLED'), color: '#eb171f' },
        { key: 'CONSTRUCTION', label: '建设中', value: this.statusCount('CONSTRUCTION'), color: '#5a91fe' }
      ];
    }
  },
  methods: {
    parseTime,
    applyRouteQuery() {
      if (!this.$route || !this.$route.query) {
        return;
      }
      this.queryParams = Object.assign({}, this.queryParams, {
        companyId: undefined,
        stationName: undefined,
        stationCode: undefined,
        status: undefined
      });
      if (this.$route.query.companyId) {
        this.queryParams.companyId = Number(this.$route.query.companyId);
      }
      if (this.$route.query.status) {
        this.queryParams.status = this.$route.query.status;
      }
      if (this.$route.query.stationName) {
        this.queryParams.stationName = this.$route.query.stationName;
      }
      if (this.$route.query.stationCode) {
        this.queryParams.stationCode = this.$route.query.stationCode;
      }
    },
    statusText(value) {
      const map = {
        NORMAL: '正常',
        DISABLED: '停用',
        CONSTRUCTION: '建设中',
        WARNING: '故障'
      };
      return map[value] || value || '-';
    },
    statusTagType(value) {
      const map = {
        NORMAL: 'success',
        DISABLED: 'info',
        CONSTRUCTION: 'warning',
        WARNING: 'danger'
      };
      return map[value] || 'info';
    },
    stationTypeText(value) {
      const map = {
        BASIC: '基础站',
        ACCESS: '接入站',
        STRING: '组串站',
        STORAGE: '储能站',
        COMMERCIAL: '工商业',
        RESIDENTIAL: '户用',
        OTHER: '其他'
      };
      return map[value] || value || '-';
    },
    runModeText(value) {
      const map = {
        GRID_CONNECTED: '并网运行',
        OFF_GRID: '离网运行',
        HYBRID: '并离网混合',
        SELF_CONSUMPTION: '自发自用',
        PEAK_SHAVING: '削峰填谷'
      };
      return map[value] || value || '-';
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = (response.data || []).map(item => ({
          label: item.companyName,
          value: item.companyId
        }));
      }).catch(() => {});
      this.loadCompanyTree();
    },
    loadCompanyTree() {
      this.treeLoading = true;
      companyTree().then(response => {
        this.treeOptions = response.data || [];
        this.$nextTick(() => {
          this.syncTreeSelection();
        });
        this.treeLoading = false;
      }).catch(() => {
        this.treeOptions = [];
        this.treeLoading = false;
      });
    },
    syncTreeSelection() {
      if (!this.$refs.companyTree) {
        return;
      }
      this.$refs.companyTree.setCurrentKey(this.queryParams.companyId || null);
    },
    handleCompanyTreeClick(node) {
      this.queryParams.companyId = node && node.id ? node.id : undefined;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    filterTree(nodes, keyword) {
      return (nodes || []).reduce((result, node) => {
        const children = this.filterTree(node.children || [], keyword);
        const matched = String(node.label || '').toLowerCase().includes(keyword);
        if (matched || children.length) {
          result.push(Object.assign({}, node, { children }));
        }
        return result;
      }, []);
    },
    handleCompanySelectChange(value) {
      this.queryParams.companyId = value;
      this.syncTreeSelection();
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getList() {
      this.loading = true;
      listStation(this.queryParams).then(response => {
        this.stationList = response.data || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.stationId);
      this.multiple = !selection.length;
    },
    statusCount(status) {
      return this.stationList.filter(item => item.status === status).length;
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.companyId = undefined;
      this.syncTreeSelection();
      this.handleQuery();
    },
    handleAdd() {
      this.$router.push({ path: "/ems-station/create" });
    },
    handleUpdate(row) {
      const stationId = row.stationId || this.ids[0];
      this.$router.push({ path: "/ems-station/create", query: { stationId } });
    },
    handleDetail(row) {
      const stationId = row.stationId || this.ids[0];
      this.$router.push({ path: "/ems-station/create", query: { stationId, mode: "detail" } });
    },
    handleMonitor(row) {
      this.$router.push({ path: "/ems-monitor/overview", query: { companyId: row.companyId, stationId: row.stationId } });
    },
    handleAlarm(row) {
      this.$router.push({ path: "/ems-ops/alarm-current", query: { companyId: row.companyId, stationId: row.stationId } });
    },
    handleDelete(row) {
      const stationId = row.stationId || this.ids[0];
      if (!stationId) {
        return;
      }
      this.$modal.confirm('是否确认删除选中的电站数据项？').then(() => delStation(stationId)).then(() => {
        this.getList();
        this.$modal.msgSuccess('删除成功');
      }).catch(() => {});
    },
    handleExport() {
      exportStation(this.queryParams).then(() => {
        this.$modal.msgSuccess("导出任务已提交");
      });
    }
  }
};
</script>

<style scoped>
/* 面板撑满，竖线上下对称 */
.station-page.nco-settings-container {
  height: calc(100vh - 4rem);
  min-height: calc(100vh - 4rem);
}

.station-page .nco-settings-container-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.station-layout {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  background: #fff;
}

.station-layout::before {
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

.station-main-panel {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
}

.station-main-panel ::v-deep .el-table__empty-block {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 100% !important;
  max-width: 100%;
  height: auto !important;
  min-height: 160px;
  box-sizing: border-box;
}

.station-main-panel ::v-deep .el-table__body-wrapper {
  height: auto !important;
}

.station-main-panel .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.station-main-panel .ems-list-search--advanced {
  margin-top: 12px;
}

.station-main-panel .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.station-main-panel .ems-list-search__control {
  width: 11rem;
}

.station-main-panel .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.station-main-panel .expand-trigger:hover,
.station-main-panel .expand-trigger:focus {
  color: #0747c7;
}

.station-main-panel .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.station-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.station-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.station-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.station-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.station-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.station-toolbar__right .el-button--primary.is-plain {
  color: #0a59f7;
  background: #fff;
  border-color: #0a59f7;
}

.station-toolbar__right .el-button--primary.is-plain:hover,
.station-toolbar__right .el-button--primary.is-plain:focus {
  color: #fff;
  background: #0a59f7;
  border-color: #0a59f7;
}

.station-kpis {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
}

.station-kpi-tag {
  display: inline-flex;
  align-items: center;
  height: 1.5rem;
  padding: 0 0.75rem;
  border-radius: 1rem;
  background: #f3f3f3;
  cursor: default;
  user-select: none;
  outline: none;
}

.station-kpi-tag:hover {
  background: #eeeeee;
}

.station-kpi-tag__icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
  display: block;
}

.station-kpi-tag__num {
  color: #000;
  font-size: 0.75rem;
  line-height: 1;
}

@media (max-width: 1280px) {
  .station-layout {
    flex-direction: column;
  }

  .station-layout::before {
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

  .station-toolbar {
    flex-wrap: wrap;
  }
}
</style>
