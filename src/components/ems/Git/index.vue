<template>
  <div>
    <img :src="gitIcon" class="ems-icon" alt="源码地址" @click="goto">
  </div>
</template>

<script>
import gitIcon from '@/assets/images/git.svg'

export default {
  name: 'EmsGit',
  data() {
    return {
      gitIcon,
      url: 'https://github.com/roinli/HUIZHI-witos-cloud'
    }
  },
  methods: {
    goto() {
      window.open(this.url)
    }
  }
}
</script>

<style scoped>
.ems-icon {
  width: 21px;
  height: 21px;
  cursor: pointer;
  display: block;
}
</style>
