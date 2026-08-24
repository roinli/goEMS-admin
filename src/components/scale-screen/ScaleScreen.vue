<template>
  <div ref="screenWrapper" class="screen-wrapper" :style="wrapperStyle">
    <slot />
  </div>
</template>

<script>
function debounce(fn, delay) {
  let timer = null
  return function debounced(...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      if (typeof fn === 'function') {
        fn.apply(null, args)
      }
      timer = null
    }, delay > 0 ? delay : 100)
  }
}

const FULLSCREEN_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange'
]

export default {
  name: 'ScaleScreen',
  props: {
    width: {
      type: [String, Number],
      default: 1920
    },
    height: {
      type: [String, Number],
      default: 1080
    },
    fullScreen: {
      type: Boolean,
      default: false
    },
    autoScale: {
      type: [Object, Boolean],
      default: true
    },
    selfAdaption: {
      type: Boolean,
      default: true
    },
    /** 按父容器尺寸缩放（嵌入 Layout 内容区时用），默认按浏览器视口 */
    fitParent: {
      type: Boolean,
      default: false
    },
    delay: {
      type: Number,
      default: 500
    },
    wrapperStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      currentWidth: 0,
      currentHeight: 0,
      originalWidth: 0,
      originalHeight: 0,
      onResize: null,
      onFullscreenChange: null,
      fullscreenRetryTimer: null,
      parentObserver: null
    }
  },
  watch: {
    selfAdaption(val) {
      if (val) {
        this.resize()
        this.addListener()
      } else {
        this.clearListener()
        this.clearStyle()
      }
    }
  },
  mounted() {
    this.onResize = debounce(() => {
      this.resize()
    }, this.delay)
    this.onFullscreenChange = () => {
      this.handleFullscreenChange()
    }
    this.$nextTick(() => {
      if (this.selfAdaption) {
        this.resize()
        this.addListener()
      }
    })
  },
  beforeDestroy() {
    this.clearListener()
  },
  methods: {
    getScreenWrapper() {
      return this.$refs.screenWrapper
    },
    getViewportSize() {
      if (this.fitParent) {
        const screenWrapper = this.getScreenWrapper()
        const parent = screenWrapper && screenWrapper.parentNode
        if (parent) {
          const width = parent.clientWidth || 0
          const height = parent.clientHeight || 0
          if (width > 0 && height > 0) {
            return { width, height }
          }
        }
      }
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
      const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      return { width, height }
    },
    initSize() {
      return new Promise(resolve => {
        const screenWrapper = this.getScreenWrapper()
        if (!screenWrapper || !screenWrapper.parentNode) {
          resolve()
          return
        }

        screenWrapper.parentNode.style.overflow = 'hidden'
        screenWrapper.parentNode.scrollLeft = 0
        screenWrapper.parentNode.scrollTop = 0

        this.$nextTick(() => {
          if (this.width && this.height) {
            this.currentWidth = Number(this.width)
            this.currentHeight = Number(this.height)
          } else {
            this.currentWidth = screenWrapper.clientWidth
            this.currentHeight = screenWrapper.clientHeight
          }

          if (!this.originalHeight || !this.originalWidth) {
            this.originalWidth = window.screen.width
            this.originalHeight = window.screen.height
          }
          resolve()
        })
      })
    },
    updateSize() {
      const screenWrapper = this.getScreenWrapper()
      if (!screenWrapper) {
        return
      }
      if (this.currentWidth && this.currentHeight) {
        screenWrapper.style.width = `${this.currentWidth}px`
        screenWrapper.style.height = `${this.currentHeight}px`
      } else {
        screenWrapper.style.width = `${this.originalWidth}px`
        screenWrapper.style.height = `${this.originalHeight}px`
      }
    },
    handleAutoScale(scale) {
      if (!this.autoScale) {
        return
      }
      const screenWrapper = this.getScreenWrapper()
      if (!screenWrapper) {
        return
      }
      const domWidth = screenWrapper.clientWidth
      const domHeight = screenWrapper.clientHeight
      const { width: currentWidth, height: currentHeight } = this.getViewportSize()
      screenWrapper.style.transform = `scale(${scale}, ${scale})`
      let mx = Math.max((currentWidth - domWidth * scale) / 2, 0)
      let my = Math.max((currentHeight - domHeight * scale) / 2, 0)
      if (typeof this.autoScale === 'object') {
        if (!this.autoScale.x) {
          mx = 0
        }
        if (!this.autoScale.y) {
          my = 0
        }
      }
      screenWrapper.style.margin = `${my}px ${mx}px`
    },
    updateScale() {
      const screenWrapper = this.getScreenWrapper()
      if (!screenWrapper) {
        return
      }
      const { width: currentWidth, height: currentHeight } = this.getViewportSize()
      const realWidth = this.currentWidth || this.originalWidth
      const realHeight = this.currentHeight || this.originalHeight
      const widthScale = currentWidth / realWidth
      const heightScale = currentHeight / realHeight

      if (this.fullScreen) {
        screenWrapper.style.transform = `scale(${widthScale}, ${heightScale})`
        screenWrapper.style.margin = '0'
        return
      }

      const scale = Math.min(widthScale, heightScale)
      this.handleAutoScale(scale)
    },
    handleFullscreenChange() {
      if (!this.selfAdaption) {
        return
      }
      if (this.fullscreenRetryTimer) {
        clearTimeout(this.fullscreenRetryTimer)
        this.fullscreenRetryTimer = null
      }
      const run = () => {
        this.resize()
      }
      this.$nextTick(() => {
        run()
        this.fullscreenRetryTimer = setTimeout(() => {
          run()
          this.fullscreenRetryTimer = setTimeout(run, 200)
        }, 50)
      })
    },
    clearListener() {
      window.removeEventListener('resize', this.onResize)
      if (this.onFullscreenChange) {
        FULLSCREEN_EVENTS.forEach(eventName => {
          document.removeEventListener(eventName, this.onFullscreenChange)
        })
      }
      if (window.visualViewport && this.onResize) {
        window.visualViewport.removeEventListener('resize', this.onResize)
      }
      if (this.parentObserver) {
        this.parentObserver.disconnect()
        this.parentObserver = null
      }
      if (this.fullscreenRetryTimer) {
        clearTimeout(this.fullscreenRetryTimer)
        this.fullscreenRetryTimer = null
      }
    },
    addListener() {
      window.addEventListener('resize', this.onResize)
      if (this.onFullscreenChange) {
        FULLSCREEN_EVENTS.forEach(eventName => {
          document.addEventListener(eventName, this.onFullscreenChange)
        })
      }
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this.onResize)
      }
      if (this.fitParent && typeof ResizeObserver !== 'undefined') {
        const screenWrapper = this.getScreenWrapper()
        const parent = screenWrapper && screenWrapper.parentNode
        if (parent) {
          this.parentObserver = new ResizeObserver(() => {
            if (this.onResize) {
              this.onResize()
            }
          })
          this.parentObserver.observe(parent)
        }
      }
    },
    clearStyle() {
      const screenWrapper = this.getScreenWrapper()
      if (!screenWrapper || !screenWrapper.parentNode) {
        return
      }
      screenWrapper.parentNode.style.overflow = 'auto'
      screenWrapper.style.cssText = ''
    },
    async resize() {
      if (!this.selfAdaption) {
        return
      }
      await this.initSize()
      this.updateSize()
      this.updateScale()
    }
  }
}
</script>

<style scoped>
.screen-wrapper {
  position: relative;
  overflow: hidden;
  z-index: 1;
  transform-origin: left top;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 500ms;
}
</style>
