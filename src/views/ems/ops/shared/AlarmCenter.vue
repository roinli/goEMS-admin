<template>
  <div class="app-container alarm-page nco-settings-container">
    <div class="new-style-menu-title">告警管理</div>
    <div class="nco-settings-container-content">
      <alarm-page-nav :section="section" :tab="tab" />
      <keep-alive>
        <component :is="panelComponent" :key="panelKey" />
      </keep-alive>
    </div>
  </div>
</template>

<script>
import AlarmPageNav from '../components/AlarmPageNav.vue'
import AlarmCurrentPanel from '../panels/AlarmCurrentPanel.vue'
import AlarmHistoryPanel from '../panels/AlarmHistoryPanel.vue'
import AlarmSettingPanel from '../panels/AlarmSettingPanel.vue'

function resolvePanel(path) {
  const value = String(path || '').replace(/\/+$/, '')
  if (/\/alarm-history$/.test(value)) {
    return 'history'
  }
  if (/\/alarm-setting$/.test(value)) {
    return 'setting'
  }
  return 'current'
}

const PANEL_MAP = {
  current: 'AlarmCurrentPanel',
  history: 'AlarmHistoryPanel',
  setting: 'AlarmSettingPanel'
}

export default {
  name: 'EmsAlarmCenter',
  components: {
    AlarmPageNav,
    AlarmCurrentPanel,
    AlarmHistoryPanel,
    AlarmSettingPanel
  },
  computed: {
    panelKey() {
      return resolvePanel(this.$route.path)
    },
    section() {
      return this.panelKey === 'setting' ? 'setting' : 'device'
    },
    tab() {
      if (this.panelKey === 'history') {
        return 'history'
      }
      return 'current'
    },
    panelComponent() {
      return PANEL_MAP[this.panelKey] || 'AlarmCurrentPanel'
    }
  }
}
</script>
