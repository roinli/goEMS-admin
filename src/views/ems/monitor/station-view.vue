<template>
  <div class="app-container station-view-page" :class="{ 'is-embedded': embedded }">
    <div v-if="!embedded" class="page-head">
      <div>
        <div class="page-title">电站视图</div>
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

    <el-card v-if="!embedded" shadow="never" class="view-card tab-card">
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
        <div v-if="!viewTabs.length" class="view-empty">当前电站还没有保存物理视图页签</div>
      </el-tabs>
    </el-card>

    <div class="view-canvas-row huawei-physical" v-loading="loading">
      <div class="physical-toolbar">
        <div class="physical-toolbar__meta">{{ renderNodes.length }} 节点 / {{ renderRelations.length }} 连线</div>
        <div class="physical-toolbar__actions">
          <el-button size="mini" class="physical-toolbar__btn physical-toolbar__btn--refresh" @click="handleQuery">刷新</el-button>
          <el-button
            type="primary"
            size="mini"
            class="physical-toolbar__btn physical-toolbar__btn--save"
            :loading="saving"
            :disabled="!queryParams.stationId"
            @click="handleSaveView"
          >保存视图</el-button>
        </div>
      </div>

      <div class="physical-workspace">
        <div
          class="station-canvas"
          ref="canvas"
          :class="{ 'is-panning': isPanning }"
          @mousedown="onCanvasMouseDown"
        >
          <div class="station-canvas__stage" :style="stageStyle">
            <svg class="view-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                v-for="line in renderLines"
                :key="line.key"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
              />
            </svg>
            <div
              v-for="node in renderNodes"
              :key="nodeKey(node)"
              class="station-node"
              :class="['is-' + nodeStatusKey(node), { 'is-region': isRegionNode(node) }]"
              :style="nodeStyle(node)"
              :title="nodeLabel(node)"
            >
              <div class="station-node__grid" aria-hidden="true">
                <i v-for="cell in 24" :key="'cell-' + cell" />
              </div>
              <span class="station-node__badge" :class="'is-' + nodeStatusKey(node)" aria-hidden="true">
                <svg viewBox="0 0 16 16" class="station-node__badge-icon">
                  <circle cx="8" cy="8" r="7" fill="currentColor" />
                  <path
                    fill="#fff"
                    d="M6.1 4.4h1.3v2.2h1.2V4.4h1.3v2.2c1.1.2 1.9 1.1 1.9 2.2v3.2c0 .5-.4.9-.9.9H5.1c-.5 0-.9-.4-.9-.9V8.8c0-1.1.8-2 1.9-2.2V4.4zm.9 3.4c-.6 0-1 .4-1 1v2.6h4V8.8c0-.6-.4-1-1-1H7z"
                  />
                </svg>
              </span>
              <div v-if="isRegionNode(node)" class="station-node__name">{{ nodeLabel(node) }}</div>
              <template v-else>
                <div class="station-node__power">{{ nodePower(node) }}</div>
                <div class="station-node__id">{{ nodeCode(node) }}</div>
              </template>
            </div>
            <div v-if="!loading && !renderNodes.length" class="physical-empty">暂无物理视图数据</div>
          </div>

          <div class="physical-minimap" aria-hidden="true">
            <div class="physical-minimap__title">概览</div>
            <div class="physical-minimap__body">
              <div
                v-for="node in renderNodes"
                :key="'mini-' + nodeKey(node)"
                class="physical-minimap__node"
                :style="minimapNodeStyle(node)"
              />
              <div class="physical-minimap__viewport" :style="minimapViewportStyle" />
            </div>
          </div>

          <div class="physical-legend">
            <span class="physical-legend__item"><i class="physical-legend__icon is-inverter" />逆变器</span>
            <span class="physical-legend__item"><i class="physical-legend__icon is-module" />组件</span>
            <span class="physical-legend__item"><i class="physical-legend__dot is-normal" />优化器正常</span>
            <span class="physical-legend__item"><i class="physical-legend__dot is-fault" />优化器故障</span>
            <span class="physical-legend__item"><i class="physical-legend__dot is-offline" />优化器离线</span>
            <span class="physical-legend__item"><i class="physical-legend__dot is-disconnect" />优化器断线</span>
            <span class="physical-legend__item"><i class="el-icon-question" />功率色值</span>
          </div>

          <div class="physical-tools">
            <button type="button" class="physical-tools__btn" title="适应画布" @click="fitView">
              <i class="el-icon-full-screen" />
            </button>
            <button type="button" class="physical-tools__btn" title="放大" @click="zoomIn">
              <i class="el-icon-zoom-in" />
            </button>
            <button type="button" class="physical-tools__btn" title="缩小" @click="zoomOut">
              <i class="el-icon-zoom-out" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="view-bottom-row">
      <div class="view-bottom-row__info" v-loading="loading">
        <div class="view-section-head">
          <span class="view-section-title">电站信息</span>
        </div>
        <div class="station-info-list">
          <div class="station-info-item"><span>公司</span><b>{{ valueOf(detail.companyName) }}</b></div>
          <div class="station-info-item"><span>电站</span><b>{{ valueOf(detail.stationName) }}</b></div>
          <div class="station-info-item"><span>地址</span><b>{{ valueOf(detail.address) }}</b></div>
          <div class="station-info-item"><span>装机容量</span><b>{{ valueOf(detail.capacityKw, '0') }} kW</b></div>
          <div class="station-info-item"><span>天气</span><b>{{ valueOf(detail.weather) }}</b></div>
          <div class="station-info-item"><span>组串容量</span><b>{{ valueOf(detail.stringCapacityKw, '0') }} kW</b></div>
          <div class="station-info-item"><span>状态</span><b>{{ stationStatusText(detail.statusText || detail.status) }}</b></div>
        </div>
      </div>
      <div class="view-bottom-row__metrics">
        <div class="view-section-head">
          <span class="view-section-title">实时指标</span>
        </div>
        <el-table :data="metricRows" size="mini" class="ems-list-table view-metric-table">
          <el-table-column label="指标" prop="name" min-width="160">
            <template slot-scope="scope">
              <span>{{ metricText(scope.row.name) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="值" prop="value" width="140" />
          <el-table-column label="单位" prop="unit" width="90">
            <template slot-scope="scope">
              <span>{{ unitText(scope.row.unit) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div v-if="!embedded" class="view-device-row">
      <div class="view-section-head">
        <span class="view-section-title">设备列表</span>
      </div>
      <el-table :data="deviceRows" size="mini" class="ems-list-table view-device-table">
        <el-table-column label="设备名称" prop="deviceName" min-width="140" />
        <el-table-column label="设备类型" prop="deviceType" width="130">
          <template slot-scope="scope">
            <span>{{ deviceTypeText(scope.row.deviceType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="通讯状态" prop="commStatus" width="120">
          <template slot-scope="scope">
            <span>{{ commStatusText(scope.row.commStatus) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实时功率(kW)" prop="activePower" width="140" />
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="goDeviceDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { listCompany } from "@/api/ems/company";
import { listStation } from "@/api/ems/station";
import { getMonitorStationView, saveMonitorStationView } from "@/api/ems/monitor";
import { CompanySelector, StationSelector } from "@/components/ems";
import { commStatusText, deviceTypeText, metricText, nodeTypeText, stationStatusText, unitText } from "@/views/ems/monitor/shared/monitorFormat";

export default {
  name: "EmsMonitorStationView",
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
      companyOptions: [],
      stationOptions: [],
      queryParams: {
        companyId: undefined,
        stationId: undefined
      },
      detail: {},
      metricRows: [],
      deviceRows: [],
      viewTabs: [],
      activeTabId: "",
      viewNodes: [],
      viewRelations: [],
      canvasScale: 1,
      canvasOffsetX: 0,
      canvasOffsetY: 0,
      isPanning: false,
      panStartX: 0,
      panStartY: 0,
      panOriginX: 0,
      panOriginY: 0,
      querySeq: 0
    };
  },
  computed: {
    currentStationName() {
      return this.detail.stationName || "全部电站";
    },
    renderNodes() {
      return (this.viewNodes || []).map((node, index) => this.normalizeNode(node, index));
    },
    renderRelations() {
      return this.viewRelations || [];
    },
    renderLines() {
      return this.buildLines(this.renderNodes, this.renderRelations);
    },
    stageStyle() {
      return {
        transform: `translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px) scale(${this.canvasScale})`,
        transformOrigin: "center center"
      };
    },
    minimapViewportStyle() {
      const size = Math.min(100, Math.max(14, 100 / this.canvasScale));
      const canvas = this.$refs.canvas;
      const width = (canvas && canvas.clientWidth) || 1;
      const height = (canvas && canvas.clientHeight) || 1;
      // 画布平移方向与预览视口相反
      const shiftX = (this.canvasOffsetX / width) * (100 / this.canvasScale);
      const shiftY = (this.canvasOffsetY / height) * (100 / this.canvasScale);
      const left = Math.max(0, Math.min(100 - size, 50 - size / 2 - shiftX));
      const top = Math.max(0, Math.min(100 - size, 50 - size / 2 - shiftY));
      return {
        left: left + "%",
        top: top + "%",
        width: size + "%",
        height: size + "%"
      };
    }
  },
  beforeDestroy() {
    this.unbindCanvasPan();
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
        this.detail = Object.assign({}, this.detail, station, {
          statusText: station.statusText || station.status || "正常"
        });
      });
    },
    handleCompanyChange() {
      this.queryParams.stationId = undefined;
      this.loadStationOptions().then(() => {
        this.handleQuery();
      });
    },
    handleQuery() {
      const requestId = ++this.querySeq;
      this.loading = true;
      getMonitorStationView({
        companyId: this.queryParams.companyId,
        stationId: this.queryParams.stationId,
        tabId: this.activeTabId || undefined
      }).then(response => {
        if (requestId !== this.querySeq) {
          return;
        }
        this.applyViewResponse(response.data || response || {});
        this.loading = false;
      }).catch(() => {
        if (requestId !== this.querySeq) {
          return;
        }
        this.metricRows = [];
        this.deviceRows = [];
        this.viewTabs = [];
        this.activeTabId = "";
        this.viewNodes = [];
        this.viewRelations = [];
        this.loading = false;
      });
    },
    applyViewResponse(data) {
      const station = data.selectedStation || {};
      this.detail = Object.assign({}, this.detail, station, {
        statusText: station.statusText || station.status || "正常"
      });
      this.metricRows = data.realtimeMetrics || [];
      this.deviceRows = data.stationDevices || [];
      this.viewTabs = data.viewTabs || [];
      this.activeTabId = data.activeTab && data.activeTab.id ? String(data.activeTab.id) : "";
      this.viewNodes = Array.isArray(data.viewNodes) ? data.viewNodes : [];
      this.viewRelations = Array.isArray(data.viewRelations) ? data.viewRelations : [];
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.loadStationOptions().then(() => {
        this.handleQuery();
      });
    },
    valueOf(value, fallback = "--") {
      return value === undefined || value === null || value === "" ? fallback : value;
    },
    deviceTypeText,
    commStatusText,
    metricText,
    unitText,
    stationStatusText,
    handleTabClick() {
      this.handleQuery();
    },
    handleSaveView() {
      if (!this.queryParams.stationId) {
        this.$modal.msgWarning("请先选择电站");
        return;
      }
      this.saving = true;
      saveMonitorStationView({
        stationId: this.queryParams.stationId,
        tabId: this.activeTabId || undefined,
        tabName: this.currentTabName("物理视图"),
        nodes: this.saveNodes(),
        relations: this.saveRelations(),
        bindings: []
      }).then(response => {
        this.applyViewResponse(response.data || response || {});
        this.$modal.msgSuccess("视图已保存");
        this.saving = false;
      }).catch(err => {
        const message = err && err.msg ? err.msg : "保存视图失败";
        this.$modal.msgError(message);
        this.saving = false;
      });
    },
    currentTabName(fallback) {
      const tab = (this.viewTabs || []).find(item => String(item.id) === String(this.activeTabId));
      return (tab && tab.tabName) || fallback;
    },
    normalizeNode(node, index) {
      // 接口常给很宽的区域节点，显示时收窄，统一按 4 宽 × 6 高正方形拼成
      let width = this.percentValue(node.width, 6);
      if (width > 7) {
        width = 6;
      }
      const height = Number((width * 6 / 4).toFixed(2));
      return Object.assign({}, node, {
        clientKey: node.clientKey || (node.id ? String(node.id) : `node-${index + 1}`),
        x: this.percentValue(node.x, 0),
        y: this.percentValue(node.y, 0),
        width,
        height,
        sortNo: node.sortNo || index + 1
      });
    },
    isRegionNode(node) {
      const type = String((node && node.nodeType) || "").toUpperCase();
      return type === "INVERTER_AREA" || type === "STORAGE_AREA" || type === "GRID_POINT" || type.indexOf("AREA") >= 0;
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
    nodeSubtitle(node) {
      if (node.deviceId) {
        const device = (this.deviceRows || []).find(item => item.deviceId === node.deviceId);
        return device ? device.deviceName : `设备 ${node.deviceId}`;
      }
      return "";
    },
    nodeCode(node) {
      const subtitle = this.nodeSubtitle(node);
      if (subtitle) {
        return subtitle;
      }
      const style = this.safeJson(node.nodeStyleJson);
      return style.code || style.label || node.clientKey || this.nodeLabel(node);
    },
    nodeDevice(node) {
      if (!node.deviceId) {
        return null;
      }
      return (this.deviceRows || []).find(item => item.deviceId === node.deviceId) || null;
    },
    nodePower(node) {
      const device = this.nodeDevice(node);
      if (device && device.activePower != null && device.activePower !== "") {
        const number = Number(device.activePower);
        return Number.isFinite(number) ? number.toFixed(2) : String(device.activePower);
      }
      const style = this.safeJson(node.nodeStyleJson);
      if (style.power != null && style.power !== "") {
        const number = Number(style.power);
        return Number.isFinite(number) ? number.toFixed(2) : String(style.power);
      }
      return "--";
    },
    nodeStatusKey(node) {
      const device = this.nodeDevice(node);
      const raw = device
        ? (device.commStatus || device.status || device.optimizerStatus || "")
        : (node.status || this.safeJson(node.nodeStyleJson).status || "");
      const upper = String(raw).toUpperCase();
      if (upper === "FAULT" || upper === "ERROR" || upper === "ALARM" || upper === "故障") {
        return "fault";
      }
      if (upper === "OFFLINE" || upper === "离线") {
        return "offline";
      }
      if (upper === "DISCONNECT" || upper === "DISCONNECTED" || upper === "断线") {
        return "disconnect";
      }
      // 无明确异常状态时用蓝色正常态（区域节点通常无 deviceId，不能当离线灰）
      return "normal";
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
    minimapNodeStyle(node) {
      const width = Math.min(Number(node.width) || 6, 6);
      return {
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: `${width}%`,
        height: `${Number((width * 6 / 4).toFixed(2))}%`
      };
    },
    zoomIn() {
      this.canvasScale = Math.min(1.8, Number((this.canvasScale + 0.1).toFixed(2)));
    },
    zoomOut() {
      this.canvasScale = Math.max(0.6, Number((this.canvasScale - 0.1).toFixed(2)));
    },
    fitView() {
      this.canvasScale = 1;
      this.canvasOffsetX = 0;
      this.canvasOffsetY = 0;
    },
    onCanvasMouseDown(event) {
      if (event.button !== 0) {
        return;
      }
      if (event.target.closest(".physical-minimap, .physical-legend, .physical-tools, button, .el-button")) {
        return;
      }
      event.preventDefault();
      this.isPanning = true;
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.panOriginX = this.canvasOffsetX;
      this.panOriginY = this.canvasOffsetY;
      window.addEventListener("mousemove", this.onCanvasMouseMove);
      window.addEventListener("mouseup", this.onCanvasMouseUp);
    },
    onCanvasMouseMove(event) {
      if (!this.isPanning) {
        return;
      }
      this.canvasOffsetX = this.panOriginX + (event.clientX - this.panStartX);
      this.canvasOffsetY = this.panOriginY + (event.clientY - this.panStartY);
    },
    onCanvasMouseUp() {
      this.isPanning = false;
      this.unbindCanvasPan();
    },
    unbindCanvasPan() {
      window.removeEventListener("mousemove", this.onCanvasMouseMove);
      window.removeEventListener("mouseup", this.onCanvasMouseUp);
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
          y2: target.y + target.height / 2
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
    },
    goDeviceDetail(row) {
      if (!row.deviceId) {
        return;
      }
      if (row.deviceType === "ESS") {
        this.$router.push({
          path: "/ems-monitor/storage",
          query: { stationId: this.queryParams.stationId, deviceId: row.deviceId }
        });
        return;
      }
      this.$router.push({
        path: "/ems-monitor/device-detail",
        query: { stationId: this.queryParams.stationId, deviceId: row.deviceId }
      });
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

.view-card {
  border-radius: 4px;
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

.view-empty {
  padding: 12px 0 4px;
  color: #909399;
  font-size: 13px;
}

.view-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.view-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.view-canvas-row {
  width: 100%;
  margin-bottom: 16px;
  padding: 0;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.physical-toolbar {
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

.physical-toolbar__meta {
  color: #8c8c8c;
  font-size: 12px;
}

.physical-toolbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.physical-toolbar__btn--save.el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.physical-toolbar__btn--save.el-button--primary:hover,
.physical-toolbar__btn--save.el-button--primary:focus {
  background-color: #0849d1;
  border-color: #0849d1;
}

.physical-toolbar__btn--refresh.el-button {
  color: rgba(0, 0, 0, 0.85);
  background: #fff;
  border-color: #d9d9d9;
}

.physical-toolbar__btn--refresh.el-button:hover,
.physical-toolbar__btn--refresh.el-button:focus {
  color: #fff;
  background: #0a59f7;
  border-color: #0a59f7;
}

.physical-workspace {
  display: flex;
  align-items: stretch;
  min-height: 480px;
}

.station-canvas {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 520px;
  border: none;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
  cursor: grab;
}

.station-canvas.is-panning {
  cursor: grabbing;
  user-select: none;
}

.station-canvas__stage {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.station-canvas.is-panning .station-canvas__stage {
  transition: none;
}

.view-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.25;
}

.view-lines line {
  stroke: #91b5ff;
  stroke-width: 0.6;
  stroke-linecap: round;
}

.station-node {
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
}

.station-node__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(6, 1fr);
  pointer-events: none;
}

.station-node__grid i {
  display: block;
  box-sizing: border-box;
  border-right: 1px solid rgba(170, 200, 235, 0.28);
  border-bottom: 1px solid rgba(170, 200, 235, 0.28);
}

.station-node__grid i:nth-child(4n) {
  border-right: none;
}

.station-node__grid i:nth-child(n + 21) {
  border-bottom: none;
}

.station-node.is-fault {
  background-color: #6b2a2a;
  border-color: rgba(220, 140, 140, 0.35);
}

.station-node.is-offline {
  background-color: #4a4a4a;
  border-color: rgba(180, 180, 180, 0.35);
}

.station-node.is-disconnect {
  background-color: #6b5a1e;
  border-color: rgba(220, 190, 100, 0.35);
}

.station-node__badge {
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

.station-node__badge.is-fault {
  color: #f5222d;
}

.station-node__badge.is-offline {
  color: #bfbfbf;
}

.station-node__badge.is-disconnect {
  color: #faad14;
}

.station-node__badge-icon {
  display: block;
  width: 100%;
  height: 100%;
}

.station-node.is-region {
  min-width: 44px;
}

.station-node.is-region.is-offline {
  background-color: #1a3a6e;
  border-color: rgba(120, 160, 220, 0.35);
  opacity: 0.72;
}

.station-node__name,
.station-node__power,
.station-node__id {
  position: relative;
  z-index: 1;
}

.station-node__name {
  padding: 0 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: #fff;
  letter-spacing: 0.04em;
}

.station-node__power {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.15;
  color: #fff;
  letter-spacing: 0.02em;
}

.station-node__id {
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

.physical-empty {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  color: #8c8c8c;
  font-size: 14px;
  pointer-events: none;
}

.physical-minimap {
  position: absolute;
  left: 16px;
  bottom: 56px;
  z-index: 5;
  width: 148px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 4px;
  overflow: hidden;
}

.physical-minimap__title {
  padding: 4px 8px;
  border-bottom: 1px solid #f5f5f5;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  line-height: 1.4;
}

.physical-minimap__body {
  position: relative;
  height: 88px;
  background: #fafafa;
}

.physical-minimap__node {
  position: absolute;
  background: #1a3a6e;
  border-radius: 1px;
  opacity: 0.9;
}

.physical-minimap__viewport {
  position: absolute;
  border: 1px solid #0a59f7;
  background: rgba(10, 89, 247, 0.08);
  box-sizing: border-box;
  pointer-events: none;
}

.physical-legend {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 5;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 6px 14px;
  border: 1px solid #ececec;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.96);
  white-space: nowrap;
}

.physical-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  line-height: 1;
}

.physical-legend__icon {
  display: inline-block;
  width: 14px;
  height: 10px;
  border-radius: 1px;
  background: #2f5bb8;
}

.physical-legend__icon.is-inverter {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #1f4f9c;
}

.physical-legend__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #52c41a;
}

.physical-tools {
  position: absolute;
  right: 16px;
  bottom: 56px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.physical-tools__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #ececec;
  border-radius: 50%;
  background: #fff;
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  cursor: pointer;
}

.physical-tools__btn:hover {
  color: #0a59f7;
  border-color: #91b5ff;
}

.physical-legend__dot.is-fault {
  background: #f5222d;
}

.physical-legend__dot.is-offline {
  background: #bfbfbf;
}

.physical-legend__dot.is-disconnect {
  background: #faad14;
}

.view-bottom-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  margin-bottom: 16px;
  min-width: 0;
}

.view-bottom-row__info {
  flex: 1 1 0;
  min-width: 0;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
}

.view-bottom-row__metrics {
  flex: 1 1 0;
  min-width: 0;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
}

.station-info-list {
  display: flex;
  flex-direction: column;
}

.station-info-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 0;
  border: none;
}

.station-info-item span {
  color: #666666;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  white-space: nowrap;
  flex-shrink: 0;
}

.station-info-item b {
  color: #000000;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  text-align: right;
  word-break: break-all;
}

.view-device-row {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background: #fff;
}

.view-metric-table,
.view-device-table {
  width: 100%;
}

.station-view-page.app-container {
  box-shadow: none;
}

.station-view-page.is-embedded {
  padding: 0;
  margin: 0;
  background: transparent;
  box-shadow: none;
}

.station-view-page.is-embedded .view-canvas-row,
.station-view-page.is-embedded .view-bottom-row__info,
.station-view-page.is-embedded .view-bottom-row__metrics,
.station-view-page.is-embedded .view-device-row {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.station-view-page.is-embedded .view-canvas-row {
  margin-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
}

.station-view-page.is-embedded .view-bottom-row {
  margin-bottom: 0;
  gap: 0;
}

.station-view-page.is-embedded .view-bottom-row__info {
  border-right: 1px solid #f0f0f0;
}

@media (max-width: 1100px) {
  .view-bottom-row {
    flex-direction: column;
  }

  .view-bottom-row__info,
  .view-bottom-row__metrics {
    flex: 1 1 auto;
    width: 100%;
  }

  .physical-legend {
    left: 16px;
    right: 60px;
    transform: none;
    flex-wrap: wrap;
    white-space: normal;
    gap: 8px 12px;
  }
}
</style>
