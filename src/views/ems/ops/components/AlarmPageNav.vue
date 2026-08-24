<template>
  <div class="alarm-page-nav" :class="{ 'has-tabs': section === 'device' }">
    <ul class="alarm-page-nav__primary ant-menu-overflow">
      <li
        class="alarm-page-nav__primary-item"
        :class="{ 'is-active': section === 'device' }"
        @click="goDevice"
      >
        设备告警
      </li>
      <li class="alarm-page-nav__sep" aria-hidden="true" />
      <li
        class="alarm-page-nav__primary-item"
        :class="{ 'is-active': section === 'setting' }"
        @click="goSetting"
      >
        告警设置
      </li>
    </ul>

    <ul v-if="section === 'device'" class="alarm-page-nav__tabs">
      <li
        class="alarm-page-nav__tab"
        :class="{ 'is-active': tab === 'current' }"
        @click="goCurrent"
      >
        当前告警
      </li>
      <li
        class="alarm-page-nav__tab"
        :class="{ 'is-active': tab === 'history' }"
        @click="goHistory"
      >
        历史告警
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'AlarmPageNav',
  props: {
    /** device | setting */
    section: {
      type: String,
      default: 'device'
    },
    /** current | history（仅 section=device 时有效） */
    tab: {
      type: String,
      default: 'current'
    }
  },
  methods: {
    switchTo(path) {
      if ((this.$route.path || '').replace(/\/+$/, '') === path) {
        return
      }
      // 同壳内切换，保留 query（如公司/电站），避免整页闪烁
      this.$router.push({ path, query: this.$route.query }).catch(() => {})
    },
    goDevice() {
      if (this.section === 'device') {
        return
      }
      this.switchTo('/ems-ops/alarm-current')
    },
    goSetting() {
      if (this.section === 'setting') {
        return
      }
      this.switchTo('/ems-ops/alarm-setting')
    },
    goCurrent() {
      if (this.tab === 'current') {
        return
      }
      this.switchTo('/ems-ops/alarm-current')
    },
    goHistory() {
      if (this.tab === 'history') {
        return
      }
      this.switchTo('/ems-ops/alarm-history')
    }
  }
}
</script>

<style scoped>
.alarm-page-nav {
  margin: 0 0 16px;
}

.alarm-page-nav__primary {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0 0 12px;
  list-style: none;
  border-bottom: 1px solid #e5e5e5;
}

/* 有二级 Tab 时，底线只保留在「当前告警 / 历史告警」下方 */
.alarm-page-nav.has-tabs .alarm-page-nav__primary {
  border-bottom: none;
  padding-bottom: 12px;
}

.alarm-page-nav.has-tabs .alarm-page-nav__tabs {
  margin-top: 4px;
}

.alarm-page-nav__primary-item {
  font-size: 14px;
  line-height: 22px;
  color: rgb(102, 102, 102);
  cursor: pointer;
  user-select: none;
}

.alarm-page-nav__primary-item:hover,
.alarm-page-nav__primary-item.is-active {
  color: #0a59f7;
}

.alarm-page-nav__sep {
  flex: 0 0 auto;
  width: 1px;
  height: 16px;
  margin: 0 16px;
  padding: 0;
  background: #d8d8d8;
  transform: scaleX(0.5);
  transform-origin: center;
  list-style: none;
  user-select: none;
}

.alarm-page-nav__tabs {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: 1px solid #e5e5e5;
}

.alarm-page-nav__tab {
  position: relative;
  height: 44px;
  margin-right: 32px;
  padding: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 44px;
  color: rgb(102, 102, 102);
  cursor: pointer;
  user-select: none;
}

.alarm-page-nav__tab:last-child {
  margin-right: 0;
}

.alarm-page-nav__tab:hover {
  color: #0a59f7;
}

.alarm-page-nav__tab.is-active {
  color: #0a59f7;
  font-weight: 500;
}

.alarm-page-nav__tab.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background-color: #0a59f7;
  border-radius: 1px;
}
</style>
