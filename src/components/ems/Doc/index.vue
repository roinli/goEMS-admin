<template>
  <div>
    <img :src="questionIcon" class="ems-doc-icon" alt="文档" @click="goto">
  </div>
</template>

<script>
import questionIcon from '@/assets/images/question.svg'

export default {
  name: 'EmsDoc',
  data() {
    return {
      questionIcon,
      url: 'http://witos.doc.huizhidata.com'
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
.ems-doc-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: block;
}
</style>
