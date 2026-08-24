<template>
  <div class="app-container logic-view-page" :class="{ 'is-embedded': embedded }">
    <div v-if="!embedded" class="page-head">
      <div>
        <div class="page-title">逻辑视图</div>
        <div class="page-subtitle">{{ currentStationName }}</div>
      </div>
      <div class="page-actions">
        <el-button size="small" icon="el-icon-back" @click="$router.back()">返回</el-button>
      </div>
    </div>

    <el-form v-if="!embedded" :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
      <el-form-item label="公司" prop="companyId">
        <company-selector
          v-model="queryParams.companyId"
          :options="companyOptions"
          clearable
          show-all
          :all-value="undefined"
          placeholder="全部公司"
          style="width: 240px"
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
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">查询</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-card v-if="!embedded" shadow="never" class="logic-card tab-card">
      <div slot="header" class="card-head">
        <span>视图页签</span>
        <el-tag size="mini" type="info">{{ viewNodes.length }} 节点 / {{ viewRelations.length }} 连线</el-tag>
      </div>
      <el-tabs v-model="activeTabId" @tab-click="handleTabClick">
        <el-tab-pane
          v-for="item in viewTabs"
          :key="String(item.id)"
          :label="item.tabName"
          :name="String(item.id)"
        />
        <div v-if="!viewTabs.length" class="view-empty">当前电站还没有保存逻辑视图页签</div>
      </el-tabs>
    </el-card>

    <div class="logic-view-panel" v-loading="loading">
      <div class="logic-toolbar">
        <div class="logic-toolbar__meta">
          <span class="logic-toolbar__count">{{ renderNodes.length }} 节点 / {{ renderRelations.length }} 连线</span>
          <el-tag size="mini" type="success">单次 {{ sessionControl.sessionSeconds || 0 }} 秒</el-tag>
          <el-tag size="mini" type="info">本月剩余 {{ sessionControl.remainingCount || 0 }}/{{ sessionControl.monthlyLimit || 0 }}</el-tag>
          <el-tag size="mini" :type="qualityTagType">{{ qualityLabel }}</el-tag>
        </div>
        <div class="logic-toolbar__actions">
          <el-button size="mini" class="logic-toolbar__btn logic-toolbar__btn--refresh" @click="handleQuery">刷新</el-button>
          <el-radio-group v-model="mode" size="mini">
            <el-radio-button label="realtime">实时</el-radio-button>
            <el-radio-button label="topology">拓扑</el-radio-button>
          </el-radio-group>
          <el-button type="primary" size="mini" :disabled="!canStartRealtime" @click="handleStartRealtime">开启实时</el-button>
          <el-button
            type="primary"
            size="mini"
            class="logic-toolbar__btn logic-toolbar__btn--save"
            :loading="saving"
            :disabled="!queryParams.stationId"
            @click="handleSaveView"
          >保存视图</el-button>
        </div>
      </div>
      <div class="logic-board">
        <svg class="logic-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            v-for="line in renderLines"
            :key="line.key"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
            :class="{ disabled: line.disabled }"
          />
        </svg>
        <button
          v-for="node in renderNodes"
          :key="nodeKey(node)"
          type="button"
          class="logic-node"
          :class="{ disabled: !renderNodeAvailable(node) }"
          :style="nodeStyle(node)"
          @click="handleRenderedNodeClick(node)"
        >
          <div class="logic-node__grid" aria-hidden="true">
            <i v-for="cell in 24" :key="'cell-' + cell" />
          </div>
          <span
            class="logic-node__badge"
            :class="{ 'is-offline': !renderNodeAvailable(node) }"
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" class="logic-node__badge-icon">
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <path
                fill="#fff"
                d="M6.1 4.4h1.3v2.2h1.2V4.4h1.3v2.2c1.1.2 1.9 1.1 1.9 2.2v3.2c0 .5-.4.9-.9.9H5.1c-.5 0-.9-.4-.9-.9V8.8c0-1.1.8-2 1.9-2.2V4.4zm.9 3.4c-.6 0-1 .4-1 1v2.6h4V8.8c0-.6-.4-1-1-1H7z"
              />
            </svg>
          </span>
          <div class="logic-node__name">{{ nodeLabel(node) }}</div>
          <div v-if="nodeMetricText(node)" class="logic-node__metric">{{ nodeMetricText(node) }}</div>
        </button>
        <div v-if="!hasRealtimeData" class="logic-empty">当前无实时数据</div>
      </div>
    </div>

    <div class="logic-bottom-row">
      <div class="logic-bottom-row__metrics">
        <div class="logic-section-head">
          <span class="logic-section-title">运行指标</span>
        </div>
        <el-table :data="metricRows" size="mini" class="ems-list-table logic-metric-table">
          <el-table-column label="指标" prop="name" min-width="130">
            <template slot-scope="scope">
              <span>{{ metricText(scope.row.name) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="当前值" prop="value" width="120" />
          <el-table-column label="单位" prop="unit" width="80">
            <template slot-scope="scope">
              <span>{{ unitText(scope.row.unit) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="logic-bottom-row__status">
        <div class="logic-section-head">
          <span class="logic-section-title">设备状态</span>
        </div>
        <el-table :data="statusRows" size="mini" class="ems-list-table logic-status-table">
          <el-table-column label="设备类型" prop="deviceType" min-width="130">
            <template slot-scope="scope">
              <span>{{ deviceTypeText(scope.row.deviceType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="在线" prop="onlineCount" width="100" />
          <el-table-column label="离线" prop="offlineCount" width="100" />
          <el-table-column label="告警" prop="alarmCount" width="100" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { listCompany } from "@/api/ems/company";
import { listStation } from "@/api/ems/station";
import { getMonitorLogicView, saveMonitorLogicView, startMonitorEnergyFlowSession } from "@/api/ems/monitor";
import { CompanySelector, StationSelector } from "@/components/ems";
import { deviceTypeText, metricText, nodeTypeText, unitText } from "@/views/ems/monitor/shared/monitorFormat";

export default {
  name: "EmsMonitorLogicView",
  components: { CompanySelector, StationSelector },
  props: {
    embedded: { type: Boolean, default: false },
    companyId: { type: [Number, String], default: undefined },
    stationId: { type: [Number, String], default: undefined }
  },
  data() {
    return {
      loading: false,
      saving: false,
      mode: "realtime",
      companyOptions: [],
      stationOptions: [],
      queryParams: {
        companyId: undefined,
        stationId: undefined
      },
      stationName: "",
      sessionControl: {
        monthlyLimit: 0,
        sessionSeconds: 0,
        usedCount: 0,
        remainingCount: 0
      },
      energyFlow: {
        nodes: [],
        edges: [],
        visible: false
      },
      stationDevices: [],
      viewTabs: [],
      activeTabId: "",
      viewNodes: [],
      viewRelations: [],
      hasRealtimeData: false,
      metricRows: [
        { name: "光伏功率", value: "--", unit: "kW" },
        { name: "储能功率", value: "--", unit: "kW" },
        { name: "负载功率", value: "--", unit: "kW" },
        { name: "并网功率", value: "--", unit: "kW" }
      ],
      statusRows: []
    };
  },
  computed: {
    currentStationName() {
      return this.stationName || "全部电站";
    },
    canStartRealtime() {
      return this.mode === "realtime" && this.nodeAvailable("pv") && (this.sessionControl.remainingCount || 0) > 0 && this.queryParams.stationId;
    },
    showGridNode() {
      return this.nodeAvailable("grid");
    },
    qualityLabel() {
      return this.hasRealtimeData ? "实时数据正常" : "无实时数据";
    },
    qualityTagType() {
      return this.hasRealtimeData ? "success" : "warning";
    },
    renderNodes() {
      const nodes = this.mode === "topology" && this.viewNodes.length ? this.viewNodes : this.defaultLogicNodes();
      return nodes.map((node, index) => this.normalizeNode(node, index));
    },
    renderRelations() {
      if (this.mode === "topology" && this.viewNodes.length) {
        return this.viewRelations || [];
      }
      return this.defaultLogicRelations();
    },
    renderLines() {
      return this.buildLines(this.renderNodes, this.renderRelations);
    }
  },
  watch: {
    stationId() {
      if (this.embedded) {
        this.applyEmbedContext();
        this.handleQuery();
      }
    },
    companyId() {
      if (this.embedded) {
        this.applyEmbedContext();
        this.loadStationOptions().then(() => this.handleQuery());
      }
    }
  },
  created() {
    this.applyEmbedContext();
    this.loadCompanyOptions();
    this.loadStationOptions().then(() => {
      this.handleQuery();
    });
  },
  methods: {
    applyEmbedContext() {
      if (this.embedded) {
        this.queryParams.companyId = this.companyId != null && this.companyId !== "" ? Number(this.companyId) : undefined;
        this.queryParams.stationId = this.stationId != null && this.stationId !== "" ? Number(this.stationId) : undefined;
        return;
      }
      this.queryParams.companyId = this.$route.query.companyId ? Number(this.$route.query.companyId) : undefined;
      this.queryParams.stationId = this.$route.query.stationId ? Number(this.$route.query.stationId) : undefined;
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = (response.data || []).map(item => ({ label: item.companyName, value: item.companyId }));
      });
    },
    loadStationOptions() {
      const query = { pageNum: 1, pageSize: 9999 };
      if (this.queryParams.companyId) {
        query.companyId = this.queryParams.companyId;
      }
      return listStation(query).then(response => {
        const rows = response.data || [];
        this.stationOptions = rows.map(item => ({ label: item.stationName, value: item.stationId }));
        const station = rows.find(item => item.stationId === this.queryParams.stationId) || rows[0] || {};
        if (!this.queryParams.stationId && station.stationId) {
          this.queryParams.stationId = station.stationId;
        }
        this.stationName = station.stationName || "";
      });
    },
    handleCompanyChange() {
      this.queryParams.stationId = undefined;
      this.loadStationOptions().then(() => {
        this.handleQuery();
      });
    },
    handleQuery() {
      this.loading = true;
      getMonitorLogicView({
        companyId: this.queryParams.companyId,
        stationId: this.queryParams.stationId,
        tabId: this.activeTabId || undefined
      }).then(response => {
        this.applyViewPayload(response.data || response || {});
        this.loading = false;
      }).catch(() => {
        this.statusRows = [];
        this.viewTabs = [];
        this.activeTabId = "";
        this.viewNodes = [];
        this.viewRelations = [];
        this.hasRealtimeData = false;
        this.loading = false;
      });
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.loadStationOptions().then(() => {
        this.handleQuery();
      });
    },
    nodeAvailable(key) {
      const node = (this.energyFlow.nodes || []).find(item => item.key === key);
      return !node || node.available;
    },
    handleTabClick() {
      this.handleQuery();
    },
    handleSaveView() {
      if (!this.queryParams.stationId) {
        this.$modal.msgWarning("请先选择电站");
        return;
      }
      this.saving = true;
      saveMonitorLogicView({
        stationId: this.queryParams.stationId,
        tabId: this.activeTabId || undefined,
        tabName: this.currentTabName("逻辑视图"),
        nodes: this.saveNodes(),
        relations: this.saveRelations(),
        bindings: []
      }).then(response => {
        this.applyViewPayload(response.data || response || {});
        this.mode = "topology";
        this.$modal.msgSuccess("视图已保存");
        this.saving = false;
      }).catch(err => {
        const message = err && err.msg ? err.msg : "保存视图失败";
        this.$modal.msgError(message);
        this.saving = false;
      });
    },
    applyViewPayload(data) {
      const rows = data.stations || [];
      const selectedStation = data.selectedStation || {};
      const station = selectedStation.stationId ? selectedStation : rows.find(item => item.stationId === this.queryParams.stationId) || rows[0] || {};
      this.stationName = station.stationName || this.stationName;
      this.sessionControl = data.sessionControl || this.sessionControl;
      this.energyFlow = data.energyFlow || this.energyFlow;
      this.stationDevices = data.stationDevices || [];
      this.viewTabs = data.viewTabs || [];
      this.activeTabId = data.activeTab && data.activeTab.id ? String(data.activeTab.id) : "";
      this.viewNodes = data.viewNodes || [];
      this.viewRelations = data.viewRelations || [];
      this.hasRealtimeData = this.hasRealtimeSamples();
      this.applyMetricRows(station);
    },
    hasRealtimeSamples() {
      return (this.stationDevices || []).some(item => {
        return item.realtimeQuality === "GOOD" || !!item.realtimeSampleTime;
      });
    },
    deviceTypeText,
    metricText,
    unitText,
    applyMetricRows(station) {
      const nodeMap = {};
      (this.energyFlow.nodes || []).forEach(item => {
        nodeMap[item.key] = item;
      });
      this.metricRows = [
        { name: "光伏功率", value: (nodeMap.pv && nodeMap.pv.power) || 0, unit: "kW" },
        { name: "储能功率", value: (nodeMap.storage && nodeMap.storage.power) || 0, unit: "kW" },
        { name: "负载功率", value: (nodeMap.load && nodeMap.load.power) || 0, unit: "kW" },
        { name: "并网功率", value: this.showGridNode ? ((nodeMap.grid && nodeMap.grid.power) || 0) : "--", unit: this.showGridNode ? "kW" : "" }
      ];
      this.statusRows = (this.energyFlow.nodes || []).filter(item => item.available).map(item => ({
        deviceType: item.label,
        onlineCount: item.deviceCount || 0,
        offlineCount: 0,
        alarmCount: station.alarmCount || 0
      }));
    },
    currentTabName(fallback) {
      const tab = (this.viewTabs || []).find(item => String(item.id) === String(this.activeTabId));
      return (tab && tab.tabName) || fallback;
    },
    handleNodeClick(key) {
      const devices = this.stationDevices || [];
      if (key === "pv") {
        const rows = devices.filter(item => item.deviceType === "INVERTER");
        if (rows.length === 1) {
          this.$router.push({ path: "/ems-monitor/device-detail", query: { stationId: this.queryParams.stationId, deviceId: rows[0].deviceId } });
          return;
        }
        this.$router.push({ path: "/ems-station/device", query: { stationId: this.queryParams.stationId, companyId: this.queryParams.companyId, deviceType: "INVERTER" } });
        return;
      }
      if (key === "storage") {
        const rows = devices.filter(item => item.deviceType === "ESS");
        if (rows.length === 1) {
          this.$router.push({ path: "/ems-monitor/storage", query: { stationId: this.queryParams.stationId, deviceId: rows[0].deviceId } });
          return;
        }
        this.$router.push({ path: "/ems-report/storage", query: { stationId: this.queryParams.stationId, companyId: this.queryParams.companyId } });
      }
    },
    handleRenderedNodeClick(node) {
      const key = this.nodeFlowKey(node);
      if (!this.renderNodeAvailable(node)) {
        return;
      }
      this.handleNodeClick(key);
    },
    handleStartRealtime() {
      if (!this.canStartRealtime) {
        return;
      }
      startMonitorEnergyFlowSession({
        stationId: this.queryParams.stationId,
        requestSource: "PC"
      }).then(response => {
        const data = response.data || response || {};
        const seconds = data.sessionSeconds || this.sessionControl.sessionSeconds || 0;
        const syncMessage = String(data.syncMessage || `平台实时同步写入 ${data.syncAffectedRows || 0} 条`)
          .replace(/\bedge\b/gi, "控制器");
        if (data.syncStatus && data.syncStatus !== "SUCCESS") {
          this.$modal.msgWarning(`实时能量流已开启，持续 ${seconds} 秒；${syncMessage}`);
        } else {
          this.$modal.msgSuccess(`实时能量流已开启，持续 ${seconds} 秒；${syncMessage}`);
        }
        this.sessionControl.remainingCount = data.remainingCount !== undefined ? data.remainingCount : this.sessionControl.remainingCount;
        this.sessionControl.monthlyLimit = data.monthlyLimit !== undefined ? data.monthlyLimit : this.sessionControl.monthlyLimit;
        this.handleQuery();
      }).catch(err => {
        const message = err && err.msg ? err.msg : "开启实时能量流失败";
        this.$modal.msgError(message);
      });
    },
    defaultLogicNodes() {
      const nodes = [
        this.viewNode("pv", "PV", "光伏阵列", "pv", 12, 12, 6, 9),
        this.viewNode("inverter", "INVERTER", "逆变器", "", 38, 12, 6, 9),
        this.viewNode("bus", "BUS", "交流母线", "", 62, 40, 6, 9),
        this.viewNode("storage", "ESS", "储能系统", "storage", 38, 68, 6, 9),
        this.viewNode("load", "LOAD", "负载", "load", 78, 18, 6, 9)
      ];
      if (this.showGridNode) {
        nodes.push(this.viewNode("grid", "GRID", "电网", "grid", 78, 66, 6, 9));
      }
      return nodes;
    },
    defaultLogicRelations() {
      const relations = [
        { sourceKey: "pv", targetKey: "inverter", relationType: "CONNECT", sortNo: 1 },
        { sourceKey: "inverter", targetKey: "bus", relationType: "CONNECT", sortNo: 2 },
        { sourceKey: "storage", targetKey: "bus", relationType: "CONNECT", sortNo: 3 },
        { sourceKey: "bus", targetKey: "load", relationType: "CONNECT", sortNo: 4 }
      ];
      if (this.showGridNode) {
        relations.push({ sourceKey: "bus", targetKey: "grid", relationType: "CONNECT", sortNo: 5 });
      }
      return relations;
    },
    viewNode(clientKey, nodeType, label, flowKey, x, y, width, height) {
      return {
        clientKey,
        nodeType,
        x,
        y,
        width,
        height,
        sortNo: 1,
        nodeStyleJson: JSON.stringify({ label, flowKey })
      };
    },
    normalizeNode(node, index) {
      const fallback = this.defaultLogicNodes()[index] || {};
      // 接口常给很宽的区域节点，显示时收窄，统一按 4 宽 × 6 高正方形拼成
      let width = this.percentValue(node.width, fallback.width || 6);
      if (width > 7) {
        width = 6;
      }
      const height = Number((width * 6 / 4).toFixed(2));
      return Object.assign({}, node, {
        clientKey: node.clientKey || (node.id ? String(node.id) : fallback.clientKey || `node-${index + 1}`),
        x: this.percentValue(node.x, fallback.x),
        y: this.percentValue(node.y, fallback.y),
        width,
        height,
        sortNo: node.sortNo || index + 1
      });
    },
    percentValue(value, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100) {
        return fallback === undefined ? 0 : fallback;
      }
      return number;
    },
    nodeKey(node) {
      return node.clientKey || node.id || node.nodeType;
    },
    nodeLabel(node) {
      const style = this.safeJson(node.nodeStyleJson);
      return style.label ? nodeTypeText(style.label) : nodeTypeText(node.nodeType);
    },
    nodeFlowKey(node) {
      const style = this.safeJson(node.nodeStyleJson);
      const map = {
        PV: "pv",
        ESS: "storage",
        LOAD: "load",
        GRID: "grid"
      };
      return style.flowKey || map[node.nodeType] || node.clientKey;
    },
    nodeMetricText(node) {
      const key = this.nodeFlowKey(node);
      const flowNode = (this.energyFlow.nodes || []).find(item => item.key === key);
      if (!flowNode || flowNode.power === undefined || flowNode.power === null || key === "inverter" || key === "bus") {
        return "";
      }
      return `${flowNode.power} kW`;
    },
    renderNodeAvailable(node) {
      const key = this.nodeFlowKey(node);
      if (key === "inverter" || key === "bus") {
        return true;
      }
      return this.nodeAvailable(key);
    },
    nodeStyle(node) {
      // 只定宽度，高度由 4:6 撑开，保证内部 4×6 格都是正方形
      return {
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: `${node.width}%`,
        height: "auto",
        aspectRatio: "4 / 6"
      };
    },
    buildLines(nodes, relations) {
      const nodeMap = {};
      nodes.forEach(node => {
        nodeMap[String(node.id)] = node;
        nodeMap[String(node.clientKey)] = node;
      });
      return (relations || []).map((relation, index) => {
        const source = nodeMap[String(relation.sourceNodeId)] || nodeMap[String(relation.sourceKey)];
        const target = nodeMap[String(relation.targetNodeId)] || nodeMap[String(relation.targetKey)];
        if (!source || !target) {
          return null;
        }
        return {
          key: relation.id || `${this.nodeKey(source)}-${this.nodeKey(target)}-${index}`,
          x1: source.x + source.width / 2,
          y1: source.y + source.height / 2,
          x2: target.x + target.width / 2,
          y2: target.y + target.height / 2,
          disabled: !this.renderNodeAvailable(source) || !this.renderNodeAvailable(target)
        };
      }).filter(Boolean);
    },
    saveNodes() {
      return this.renderNodes.map((node, index) => ({
        id: node.id,
        clientKey: node.clientKey || `node-${index + 1}`,
        nodeType: node.nodeType,
        deviceId: node.deviceId,
        componentId: node.componentId,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        nodeStyleJson: node.nodeStyleJson,
        sortNo: index + 1
      }));
    },
    saveRelations() {
      return this.renderRelations.map((relation, index) => ({
        sourceKey: relation.sourceKey || (relation.sourceNodeId ? String(relation.sourceNodeId) : undefined),
        targetKey: relation.targetKey || (relation.targetNodeId ? String(relation.targetNodeId) : undefined),
        relationType: relation.relationType || "CONNECT",
        lineStyleJson: relation.lineStyleJson,
        sortNo: index + 1
      }));
    },
    safeJson(value) {
      if (!value) {
        return {};
      }
      try {
        return JSON.parse(value);
      } catch (e) {
        return {};
      }
    }
  }
};
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

.page-subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.logic-card {
  border-radius: 6px;
}

.tab-card {
  margin-bottom: 12px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.logic-view-panel {
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.logic-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 50px;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.logic-toolbar__meta {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.logic-toolbar__count {
  color: #8c8c8c;
  font-size: 12px;
  white-space: nowrap;
}

.logic-toolbar__actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.logic-toolbar__actions > .el-button,
.logic-toolbar__actions > .el-radio-group {
  margin-left: 0;
}

.logic-toolbar__actions .el-button + .el-button {
  margin-left: 0;
}

.logic-toolbar__btn--save.el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.logic-toolbar__btn--save.el-button--primary:hover,
.logic-toolbar__btn--save.el-button--primary:focus {
  background-color: #0849d1;
  border-color: #0849d1;
}

.logic-toolbar__btn--refresh.el-button {
  color: rgba(0, 0, 0, 0.85);
  background: #fff;
  border-color: #d9d9d9;
}

.logic-toolbar__btn--refresh.el-button:hover,
.logic-toolbar__btn--refresh.el-button:focus {
  color: #fff;
  background: #0a59f7;
  border-color: #0a59f7;
}

.logic-board {
  position: relative;
  height: 520px;
  border: none;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
}

.logic-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logic-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.logic-bottom-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  margin-top: 16px;
  margin-bottom: 16px;
  min-width: 0;
}

.logic-bottom-row__metrics,
.logic-bottom-row__status {
  flex: 1 1 0;
  min-width: 0;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
}

.logic-metric-table,
.logic-status-table {
  width: 100%;
}

.logic-empty {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  color: #8c8c8c;
  font-size: 14px;
  pointer-events: none;
}

.view-empty {
  padding: 12px 0 4px;
  color: #909399;
  font-size: 13px;
}

.logic-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.25;
}

.logic-lines line {
  stroke: #91b5ff;
  stroke-width: 0.6;
  stroke-linecap: round;
}

.logic-lines line.disabled {
  stroke: #c0c4cc;
  stroke-dasharray: 2 2;
  opacity: 0.8;
}

.logic-node {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  /* 窄长方形：宽 4 个正方形 × 高 6 个正方形 */
  aspect-ratio: 4 / 6;
  padding: 0;
  box-sizing: border-box;
  border: 1px solid rgba(140, 180, 230, 0.45);
  border-radius: 3px;
  background-color: #1a3a6e;
  color: #fff;
  text-align: center;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.logic-node__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(6, 1fr);
  pointer-events: none;
}

.logic-node__grid i {
  display: block;
  box-sizing: border-box;
  border-right: 1px solid rgba(170, 200, 235, 0.28);
  border-bottom: 1px solid rgba(170, 200, 235, 0.28);
}

.logic-node__grid i:nth-child(4n) {
  border-right: none;
}

.logic-node__grid i:nth-child(n + 21) {
  border-bottom: none;
}

.logic-node__badge {
  position: absolute;
  top: 3px;
  right: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: #22c55e;
  z-index: 2;
}

.logic-node__badge.is-offline {
  color: #bfbfbf;
}

.logic-node__badge-icon {
  display: block;
  width: 100%;
  height: 100%;
}

.logic-node__name,
.logic-node__metric {
  position: relative;
  z-index: 1;
}

.logic-node__name {
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: #fff;
  letter-spacing: 0.04em;
}

.logic-node__metric {
  max-width: calc(100% - 8px);
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 1px;
  background: #000;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logic-node.disabled {
  background-color: #4a4a4a;
  border-color: rgba(180, 180, 180, 0.35);
  cursor: default;
}

.logic-node.disabled .logic-node__grid i {
  border-right-color: rgba(200, 200, 200, 0.22);
  border-bottom-color: rgba(200, 200, 200, 0.22);
}

.logic-view-page.app-container {
  box-shadow: none;
}

.logic-view-page.is-embedded {
  padding: 0;
  margin: 0;
  background: transparent;
  box-shadow: none;
}

.logic-view-page.is-embedded .logic-view-panel,
.logic-view-page.is-embedded .logic-bottom-row__metrics,
.logic-view-page.is-embedded .logic-bottom-row__status {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.logic-view-page.is-embedded .logic-view-panel {
  margin-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
}

.logic-view-page.is-embedded .logic-bottom-row {
  margin-top: 0;
  margin-bottom: 0;
  gap: 0;
}

.logic-view-page.is-embedded .logic-bottom-row__metrics {
  border-right: 1px solid #f0f0f0;
}

@media (max-width: 1100px) {
  .logic-bottom-row {
    flex-direction: column;
  }

  .logic-bottom-row__metrics,
  .logic-bottom-row__status {
    flex: 1 1 auto;
    width: 100%;
  }

  .logic-view-page.is-embedded .logic-bottom-row__metrics {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>
