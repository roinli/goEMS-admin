<template>
  <div v-show="visible" class="kpi-setting-popover-root">
    <div class="kpi-setting-popover__mask" @click="handleCancel" />
    <div
      ref="panel"
      class="kpi-setting-popover"
      :style="popoverStyle"
      @click.stop
    >
      <!-- 小三角：指向触发图标 -->
      <span class="kpi-setting-popover__arrow" :style="arrowStyle" />

      <div class="kpi-setting-popover__header">
        <span class="kpi-setting-popover__title">选择参数</span>
        <i class="el-icon-close kpi-setting-popover__close" @click="handleCancel" />
      </div>

      <div class="kpi-setting">
        <div v-for="group in groups" :key="group.key" class="kpi-setting__group">
          <div class="kpi-setting__group-title">{{ group.label }}</div>
          <div class="kpi-setting__options">
            <el-checkbox
              v-for="param in group.params"
              :key="param.key"
              :value="isChecked(param.key)"
              :disabled="isDisabled(param.key)"
              @change="checked => toggle(param.key, checked)"
            >{{ param.label }}</el-checkbox>
          </div>
        </div>
      </div>

      <div class="kpi-setting__footer">
        <div class="kpi-setting__tip">
          <i class="el-icon-info kpi-setting__tip-icon" />
          <span>最多选择{{ max }}个参数</span>
        </div>
        <div class="kpi-setting__actions">
          <el-button size="small" @click="restoreDefault">恢复默认</el-button>
          <el-button size="small" @click="handleCancel">取消</el-button>
          <el-button size="small" type="primary" :disabled="!draftKeys.length" @click="handleConfirm">确认</el-button>
        </div>
      </div>
     
    </div>
  </div>
</template>

<script>
import { KPI_PARAM_GROUPS, DEFAULT_KPI_KEYS, MAX_KPI_KEYS, normalizeKpiKeys } from './homeSupport'

export default {
  name: 'KpiSettingDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    value: {
      type: Array,
      default: () => []
    },
    // 触发元素（设置图标），用于定位气泡与小三角
    anchor: {
      type: [Object, HTMLElement],
      default: null
    }
  },
  data() {
    return {
      groups: KPI_PARAM_GROUPS,
      max: MAX_KPI_KEYS,
      draftKeys: normalizeKpiKeys(this.value),
      popoverStyle: {},
      arrowStyle: {}
    }
  },
  watch: {
    value(next) {
      this.draftKeys = normalizeKpiKeys(next)
    },
    visible(val) {
      if (val) {
        this.syncDraft()
        this.$nextTick(() => {
          this.updatePosition()
        })
        window.addEventListener('resize', this.updatePosition)
        window.addEventListener('scroll', this.updatePosition, true)
      } else {
        window.removeEventListener('resize', this.updatePosition)
        window.removeEventListener('scroll', this.updatePosition, true)
      }
    }
  },
  mounted() {
    document.body.appendChild(this.$el)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updatePosition)
    window.removeEventListener('scroll', this.updatePosition, true)
    if (this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },
  methods: {
    syncDraft() {
      this.draftKeys = normalizeKpiKeys(this.value)
    },
    updatePosition() {
      const el = this.anchor
      if (!el || typeof el.getBoundingClientRect !== 'function') {
        this.popoverStyle = {
          position: 'fixed',
          top: '80px',
          left: '120px',
          zIndex: 3000
        }
        this.arrowStyle = { left: '20px' }
        return
      }

      const rect = el.getBoundingClientRect()
      const panelWidth = 440
      const gap = 10
      const arrowHalf = 7
      // 三角默认贴近左侧，对准图标中心
      let left = rect.left + rect.width / 2 - 28
      const maxLeft = window.innerWidth - panelWidth - 12
      left = Math.max(12, Math.min(left, maxLeft))

      let top = rect.bottom + gap
      const panel = this.$refs.panel
      const panelHeight = panel ? panel.offsetHeight : 420
      if (top + panelHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - panelHeight - gap)
      }

      const arrowLeft = rect.left + rect.width / 2 - left - arrowHalf

      this.popoverStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${panelWidth}px`,
        zIndex: 3000
      }
      this.arrowStyle = {
        left: `${Math.max(16, Math.min(arrowLeft, panelWidth - 28))}px`
      }
    },
    isChecked(key) {
      return this.draftKeys.indexOf(key) !== -1
    },
    isDisabled(key) {
      return this.draftKeys.length >= this.max && this.draftKeys.indexOf(key) === -1
    },
    toggle(key, checked) {
      const index = this.draftKeys.indexOf(key)
      if (checked && index === -1) {
        if (this.draftKeys.length >= this.max) {
          this.$message.warning('最多选择' + this.max + '个参数')
          return
        }
        this.draftKeys.push(key)
      } else if (!checked && index !== -1) {
        this.draftKeys.splice(index, 1)
      }
    },
    restoreDefault() {
      this.draftKeys = DEFAULT_KPI_KEYS.slice()
    },
    handleCancel() {
      this.$emit('update:visible', false)
    },
    handleConfirm() {
      if (!this.draftKeys.length) {
        this.$message.warning('请至少选择一个参数')
        return
      }
      this.$emit('input', this.draftKeys.slice())
      this.$emit('confirm', this.draftKeys.slice())
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.kpi-setting-popover-root {
  position: relative;
  z-index: 3000;
}

.kpi-setting-popover__mask {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 2999;
}

.kpi-setting-popover {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(17, 26, 44, 0.16);
  padding: 0 0 16px;
  box-sizing: border-box;
}

.kpi-setting-popover__arrow {
  position: absolute;
  top: -7px;
  width: 14px;
  height: 14px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(17, 26, 44, 0.04);
  z-index: 1;
}

.kpi-setting-popover__header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16px;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #ececec;
  font-weight: bold;
  color: #1C1C1C;
}

.kpi-setting-popover__title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.kpi-setting-popover__close {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.kpi-setting-popover__close:hover {
  color: rgba(0, 0, 0, 0.75);
}

.kpi-setting {
  position: relative;
  z-index: 2;
  max-height: 360px;
  overflow-y: auto;
  padding: 16px 20px;
  background: #fff;
}

.kpi-setting__group {
  margin-bottom: 18px;
}

.kpi-setting__group-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.kpi-setting__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.kpi-setting__options .el-checkbox {
  margin-right: 0;
}

.kpi-setting__tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  line-height: 20px;
  color: #767676;
}

.kpi-setting__tip-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: #767676;
}

.kpi-setting__footer {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 12px 20px 0;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  border-radius: 0 0 8px 8px;
}

.kpi-setting__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

::v-deep .el-checkbox__label{
  color: #262626;
}
</style>
