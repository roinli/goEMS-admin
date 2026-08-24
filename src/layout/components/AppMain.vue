<template>
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view v-if="!$route.meta.link" :key="key" />
      </keep-alive>
    </transition>
    <iframe-toggle />
  </section>
</template>

<script>
import iframeToggle from './IframeToggle/index'
export default {
  name: 'AppMain',
  components: { iframeToggle },
  computed: {
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    },
    key() {
      const path = (this.$route.path || '').replace(/\/+$/, '')
      if (/\/ems-ops\/alarm-(current|history|setting)$/.test(path)) {
        return 'ems-alarm-center'
      }
      return this.$route.path
    }
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  background: #f0f2f5;
  min-height: calc(100vh - 4rem);
  width: 100%;
  position: relative;
  overflow: hidden;
}
</style>
