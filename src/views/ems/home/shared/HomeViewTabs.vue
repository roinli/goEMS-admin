<template>
  <div
    class="nco-home-container-switcher new-menu"
    :class="{
      'is-light': variant === 'light' || collapsed
    }"
  >
    <div
      v-for="item in tabs"
      :key="item.key"
      :class="{ 'nco-home-container-switcher-active': active === item.key }"
      :title="item.label"
      role="button"
      tabindex="0"
      @click="handleSwitch(item)"
      @keydown.enter="handleSwitch(item)"
    >
      <span class="nco-switcher-icon" v-html="item.svg" />
    </div>

    <div
      v-if="collapsible"
      :title="collapsed ? '展开概览' : '收起概览'"
      role="button"
      tabindex="0"
      @click="$emit('toggle-collapse')"
      @keydown.enter="$emit('toggle-collapse')"
    >
      <span
        class="nco-switcher-icon nco-switcher-icon--collapse"
        v-html="collapsed ? collapseDownSvg : collapseTopSvg"
      />
    </div>
  </div>
</template>

<script>
import {
  listSvg,
  mapSvg,
  kpiSvg,
  collapseTopSvg,
  collapseDownSvg
} from './switcherIcons'

const TABS = [
  { key: 'list', label: '列表视图', path: '/ems-home/list', svg: listSvg },
  { key: 'map', label: '地图视图', path: '/ems-home/map', svg: mapSvg },
  { key: 'kpi', label: 'KPI视图', path: '/ems-home/kpi', svg: kpiSvg }
]

export default {
  name: 'HomeViewTabs',
  props: {
    active: {
      type: String,
      required: true
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    collapsible: {
      type: Boolean,
      default: true
    },
    variant: {
      type: String,
      default: 'dark',
      validator: value => ['dark', 'light'].indexOf(value) !== -1
    }
  },
  data() {
    return {
      tabs: TABS,
      collapseTopSvg,
      collapseDownSvg
    }
  },
  methods: {
    handleSwitch(item) {
      if (item.key === this.active) {
        return
      }
      this.$router.push({
        path: item.path,
        query: Object.assign({}, this.$route && this.$route.query ? this.$route.query : {})
      })
    }
  }
}
</script>

<style lang="scss">
/* 地图页等独立使用时也需要；Hero 内同套样式见 HomeHeroBand */
.nco-home-container-switcher {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 2rem;
  padding: 2px;
  position: absolute;
  top: 3.3vh;
  right: 1.5rem;
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  box-sizing: border-box;
}

.nco-home-container-switcher.new-menu {
  flex-direction: row;
  width: auto;
  display: inline-flex;
  justify-content: flex-start;
}

.nco-home-container-switcher.new-menu > div {
  width: 1.75rem;
}

.nco-home-container-switcher > div {
  width: 100%;
  height: calc(2rem - 4px);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1px 0;
  cursor: pointer;
  box-sizing: border-box;
}

.nco-home-container-switcher > div:hover {
  color: rgba(255, 255, 255, 0.9);
}

.nco-home-container-switcher .nco-home-container-switcher-active {
  background-color: #fff;
  border-radius: 0.375rem;
  color: #0a59f7;
}

.nco-home-container-switcher .nco-home-container-switcher-active:hover {
  color: #0a59f7;
}

.nco-home-container-switcher .nco-switcher-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  font-size: 1rem;
  color: inherit;
  line-height: 0;
}

/* 收起/展开概览：SVG 视觉偏小，单独加大 */
.nco-home-container-switcher .nco-switcher-icon--collapse {
  font-size: 1.6rem;
}

.nco-home-container-switcher .nco-switcher-icon svg {
  width: 1em;
  height: 1em;
  display: block;
  fill: currentColor;
}

.nco-home-container-switcher.is-light {
  background-color: rgba(17, 26, 44, 0.05);
  color: #777777;
  border-radius: 8px;
}

.nco-home-container-switcher.is-light > div:hover {
  color: #555;
}

.nco-home-container-switcher.is-light .nco-home-container-switcher-active {
  background-color: #fff;
  color: #0a59f7;
}
</style>
