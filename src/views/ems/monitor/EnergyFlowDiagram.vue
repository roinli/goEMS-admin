<template>
  <div class="nco-monitor-energy-flow">
    <div class="live-data-refresh">
      <button
        type="button"
        class="enable-live-data"
        :class="{ 'is-active': liveEnabled || liveLoading }"
        :disabled="liveLoading"
        :title="liveEnabled ? '关闭实时' : '开启实时'"
        @click="toggleLive"
      >
        <span
          v-if="liveEnabled"
          class="live-progress"
          :style="liveProgressStyle"
          aria-hidden="true"
        />
        <img v-else-if="!liveLoading" class="icon" :src="realtimeIcon" alt="">
        <span class="live-data-text">{{ liveLabel }}</span>
      </button>
    </div>

    <div class="nco-monitor-energy-flow-content">
      <svg
        class="energy-flow-svg"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="实时能量流"
      >
        <defs>
          <!-- 光伏(黄) → 负载(蓝)：主竖轴，上下各一半 -->
          <linearGradient id="ef-grad-pv-load" x1="200" y1="102" x2="200" y2="198" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#f6c489" />
            <stop offset="45%" stop-color="#f6c489" />
            <stop offset="55%" stop-color="#70c2f2" />
            <stop offset="100%" stop-color="#70c2f2" />
          </linearGradient>
          <!-- 光伏→电网拐弯处：黄 → 紫（横段紧贴储能线上方） -->
          <linearGradient id="ef-grad-pv-grid-corner" x1="205" y1="139" x2="213" y2="147" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#f6c489" />
            <stop offset="100%" stop-color="#b0b7fa" />
          </linearGradient>
          <!-- 储能(青) → 电网(紫)：圆心对齐 y=150 -->
          <linearGradient id="ef-grad-storage-grid" x1="118" y1="150" x2="282" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#8bd4d8" />
            <stop offset="45%" stop-color="#8bd4d8" />
            <stop offset="55%" stop-color="#b0b7fa" />
            <stop offset="100%" stop-color="#b0b7fa" />
          </linearGradient>
          <!-- 储能→负载拐弯处：青 → 蓝（紧贴光伏→负载左侧） -->
          <linearGradient id="ef-grad-storage-load-corner" x1="186" y1="153" x2="194" y2="161" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#8bd4d8" />
            <stop offset="100%" stop-color="#70c2f2" />
          </linearGradient>
        </defs>

        <g fill="none" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <!-- 储能 → 电网（圆心 y=150，贴紧节点） -->
          <path d="M118 150 L282 150" stroke="url(#ef-grad-storage-grid)" />

          <!-- 光伏 → 电网（竖轨 x=205，横段 y=147 贴紧主横线） -->
          <path d="M205 102 L205 139" stroke="#f6c489" />
          <path d="M205 139 Q205 147 213 147" stroke="url(#ef-grad-pv-grid-corner)" />
          <path d="M213 147 L282 147" stroke="#b0b7fa" />

          <!-- 光伏 → 负载（主竖轴 x=200） -->
          <path d="M200 102 L200 198" stroke="url(#ef-grad-pv-load)" />

          <!-- 储能 → 负载（左轨，横段 y=153 贴紧主横线） -->
          <path d="M118 153 L186 153" stroke="#8bd4d8" />
          <path d="M186 153 Q194 153 194 161" stroke="url(#ef-grad-storage-load-corner)" />
          <path d="M194 161 L194 198" stroke="#70c2f2" />
        </g>

        <!-- 小三角：光伏 → 负载 -->
        <g v-if="isFlowActive('pv', 'load')" class="energy-flow-arrows">
          <polygon points="-4,-2.8 4,0 -4,2.8" fill="#f6c489">
            <animateMotion path="M200 102 L200 198" dur="2.4s" repeatCount="indefinite" rotate="auto" />
          </polygon>
        </g>

        <!-- 小三角：光伏 → 电网 -->
        <g v-if="isFlowActive('pv', 'grid')" class="energy-flow-arrows">
          <polygon points="-4,-2.8 4,0 -4,2.8" fill="#f6c489">
            <animateMotion path="M205 102 L205 139 Q205 147 213 147 L282 147" dur="2.8s" repeatCount="indefinite" rotate="auto" />
          </polygon>
        </g>

        <!-- 小三角：储能 → 负载 -->
        <g v-if="isFlowActive('storage', 'load')" class="energy-flow-arrows">
          <polygon points="-4,-2.8 4,0 -4,2.8" fill="#8bd4d8">
            <animateMotion path="M118 153 L186 153 Q194 153 194 161 L194 198" dur="3.6s" repeatCount="indefinite" rotate="auto" />
          </polygon>
        </g>
      </svg>

      <div
        v-for="node in displayNodes"
        :key="node.key"
        class="energy-node"
        :class="['is-' + node.key, { 'is-offline': !node.available }]"
        :style="nodeStyle(node)"
      >
        <div v-if="node.metaPos === 'top'" class="energy-node__label">{{ node.label }}</div>

        <div class="energy-node__ring">
          <div class="energy-node__ring-inner">
            <div
              class="energy-node__icon"
              :style="iconStyle(node)"
              role="img"
              :aria-label="node.label"
            />
            <div v-if="node.key === 'storage' && node.soc != null" class="energy-node__soc">
              {{ formatSoc(node.soc) }}
            </div>
            <div class="energy-node__value">
              <template v-if="node.available">
                <b>{{ formatPower(node.power) }}</b>
                <span>kW</span>
              </template>
              <span v-else class="energy-node__offline">未接入</span>
            </div>
          </div>
        </div>

        <div v-if="node.metaPos === 'bottom'" class="energy-node__label">{{ node.label }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import realtimeIcon from "@/assets/images/monitor/energy-realTime.svg";
import iconPv from "@/assets/images/monitor/guangfu.svg";
import iconStorage from "@/assets/images/monitor/chuneng.svg";
import iconGrid from "@/assets/images/monitor/dianwang.svg";
import iconLoad from "@/assets/images/monitor/fuzai.svg";
import { startMonitorEnergyFlowSession } from "@/api/ems/monitor";

const NODE_META = {
  pv: { label: "光伏", x: 50, y: 18, metaPos: "top", icon: iconPv },
  storage: { label: "储能", x: 18, y: 50, metaPos: "bottom", icon: iconStorage },
  grid: { label: "电网", x: 82, y: 50, metaPos: "bottom", icon: iconGrid },
  load: { label: "负载", x: 50, y: 82, metaPos: "bottom", icon: iconLoad }
};

export default {
  name: "EnergyFlowDiagram",
  props: {
    nodes: { type: Array, default: () => [] },
    edges: { type: Array, default: () => [] },
    stationId: { type: [Number, String], default: undefined },
    companyId: { type: [Number, String], default: undefined }
  },
  data() {
    return {
      realtimeIcon,
      liveEnabled: false,
      liveLoading: false,
      liveTimer: null,
      liveRaf: null,
      liveProgress: 0,
      liveDuration: 60,
      liveCycleMs: 3000,
      liveStartedAt: 0
    };
  },
  computed: {
    liveLabel() {
      if (this.liveLoading) {
        return "开启中";
      }
      if (this.liveEnabled) {
        return "实时刷新中";
      }
      return "实时";
    },
    liveProgressStyle() {
      const percent = Math.max(0, Math.min(100, this.liveProgress));
      return {
        background: `conic-gradient(#8c8c8c ${percent}%, transparent 0)`
      };
    },
    nodeMap() {
      const map = {};
      (this.nodes || []).forEach(item => {
        if (item && item.key) {
          map[item.key] = item;
        }
      });
      return map;
    },
    displayNodes() {
      return ["pv", "storage", "grid", "load"].map(key => {
        const meta = NODE_META[key];
        const raw = this.nodeMap[key] || {};
        const available =
          raw.available === true ||
          (raw.available !== false && (raw.power != null || Number(raw.deviceCount) > 0));
        return {
          key,
          label: raw.label || meta.label,
          available,
          power: Number(raw.power) || 0,
          soc: raw.soc != null ? Number(raw.soc) : raw.batterySoc != null ? Number(raw.batterySoc) : null,
          x: meta.x,
          y: meta.y,
          metaPos: meta.metaPos,
          icon: meta.icon
        };
      });
    },
    availabilityMap() {
      const map = {};
      this.displayNodes.forEach(node => {
        map[node.key] = !!node.available;
      });
      return map;
    }
  },
  beforeDestroy() {
    this.clearLiveTimer();
  },
  methods: {
    isFlowActive(from, to) {
      return !!(this.availabilityMap[from] && this.availabilityMap[to]);
    },
    nodeStyle(node) {
      return { left: node.x + "%", top: node.y + "%" };
    },
    iconStyle(node) {
      const url = `url(${node.icon})`;
      return {
        WebkitMaskImage: url,
        maskImage: url
      };
    },
    formatPower(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return "--";
      }
      return Math.abs(number).toFixed(3);
    },
    formatSoc(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return "";
      }
      return Math.round(number) + "%";
    },
    clearLiveTimer() {
      if (this.liveTimer) {
        clearTimeout(this.liveTimer);
        this.liveTimer = null;
      }
      if (this.liveRaf) {
        cancelAnimationFrame(this.liveRaf);
        this.liveRaf = null;
      }
    },
    stopLive() {
      this.liveEnabled = false;
      this.liveProgress = 0;
      this.clearLiveTimer();
      this.$emit("live-change", false);
    },
    startLiveSession(seconds) {
      const duration = Number(seconds) > 0 ? Number(seconds) : 60;
      this.liveEnabled = true;
      this.liveDuration = duration;
      this.liveStartedAt = Date.now();
      this.liveProgress = 0;
      this.$emit("live-change", true);
      this.clearLiveTimer();
      this.tickLiveProgress();
      this.liveTimer = setTimeout(() => {
        this.stopLive();
      }, duration * 1000);
    },
    tickLiveProgress() {
      const tick = () => {
        if (!this.liveEnabled) {
          return;
        }
        const elapsed = (Date.now() - this.liveStartedAt) % this.liveCycleMs;
        this.liveProgress = (elapsed / this.liveCycleMs) * 100;
        this.liveRaf = requestAnimationFrame(tick);
      };
      this.liveRaf = requestAnimationFrame(tick);
    },
    toggleLive() {
      if (this.liveEnabled) {
        this.stopLive();
        return;
      }
      this.enableLive();
    },
    enableLive() {
      if (!this.stationId) {
        this.startLiveSession(60);
        return;
      }
      this.liveLoading = true;
      startMonitorEnergyFlowSession({
        stationId: this.stationId,
        companyId: this.companyId,
        requestSource: "PC"
      })
        .then(response => {
          const data = (response && response.data) || response || {};
          const seconds = Number(data.sessionSeconds) || 60;
          this.startLiveSession(seconds);
          this.$emit("session-started", data);
          if (this.$message) {
            this.$message.success(`实时能量流已开启，持续 ${seconds} 秒`);
          }
        })
        .catch(() => {
          this.startLiveSession(60);
        })
        .finally(() => {
          this.liveLoading = false;
        });
    }
  }
};
</script>

<style scoped>
.nco-monitor-energy-flow {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  box-sizing: border-box;
}

.live-data-refresh {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
}

.enable-live-data {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  background: #f7f7f7;
  color: rgba(0, 0, 0, 0.85);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.enable-live-data .icon {
  width: 14px;
  height: 14px;
}

.live-progress {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #8c8c8c;
  box-sizing: border-box;
  flex-shrink: 0;
  background: transparent;
}

.enable-live-data .live-data-text {
  color: rgba(0, 0, 0, 0.85);
  font-size: 12px;
  line-height: 1;
}

.enable-live-data.is-active {
  border-color: #e5e5e5;
  color: rgba(0, 0, 0, 0.85);
  background: #f7f7f7;
}

.enable-live-data.is-active .live-data-text {
  color: rgba(0, 0, 0, 0.85);
  font-size: 12px;
}

.enable-live-data:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.nco-monitor-energy-flow-content {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.energy-flow-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  z-index: 1;
}

.energy-node {
  position: absolute;
  width: 104px;
  /* 以圆环中心对齐 left/top%（圆环 96px → 半高 48px） */
  transform: translate(-50%, -48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}

.energy-node__ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

.energy-node__ring-inner {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 5px 3px 7px;
}

.energy-node.is-pv .energy-node__ring {
  background: #fef8ea;
  box-shadow: 0 0 0 1px #fef8ea;
}
.energy-node.is-pv .energy-node__ring-inner {
  border: 2px solid #f7d774;
  box-shadow: 0 0 8px rgba(247, 215, 116, 0.35);
}

.energy-node.is-storage .energy-node__ring {
  background: #f1ffec;
  box-shadow: 0 0 0 1px #f1ffec;
}
.energy-node.is-storage .energy-node__ring-inner {
  border: 2px solid #b1dbe0;
  box-shadow: 0 0 8px rgba(177, 219, 224, 0.4);
}

.energy-node.is-grid .energy-node__ring {
  background: #f9f2fd;
  box-shadow: 0 0 0 1px #f9f2fd;
}
.energy-node.is-grid .energy-node__ring-inner {
  border: 2px solid #cd9df6;
  box-shadow: 0 0 8px rgba(205, 157, 246, 0.35);
}

.energy-node.is-load .energy-node__ring {
  background: #e9f1fd;
  box-shadow: 0 0 0 1px #e9f1fd;
}
.energy-node.is-load .energy-node__ring-inner {
  border: 2px solid #93d2f5;
  box-shadow: 0 0 8px rgba(147, 210, 245, 0.35);
}

.energy-node.is-offline {
  opacity: 0.42;
  filter: grayscale(0.4);
}

.energy-node__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background-color: #000000;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

.energy-node.is-storage .energy-node__icon {
  width: 40px;
  height: 40px;
}

.energy-node__soc {
  margin-top: 1px;
  font-size: 10px;
  font-weight: 700;
  color: #1c1c1c;
  line-height: 1;
}

.energy-node__value {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.energy-node__value b {
  font-size: 12px;
  font-weight: 700;
  color: #1c1c1c;
}

.energy-node__value span {
  font-size: 10px;
  color: #707070;
  font-weight: 400;
}

.energy-node__value .energy-node__offline {
  font-size: 12px;
  font-weight: 400;
  color: #707070;
  line-height: 1.2;
}

.energy-node__label {
  margin-top: 6px;
  font-size: 12px;
  color: #707070;
  line-height: 1.2;
}

.energy-node.is-pv .energy-node__label {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin: 0 0 6px;
  white-space: nowrap;
}
</style>
