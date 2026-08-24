<template>
  <div class="ems-chart-container">
    <div v-if="title || subtitle || $slots.tools" class="ems-chart-container__head">
      <div>
        <div v-if="title" class="ems-chart-container__title">{{ title }}</div>
        <div v-if="subtitle" class="ems-chart-container__subtitle">{{ subtitle }}</div>
      </div>
      <div v-if="$slots.tools" class="ems-chart-container__tools">
        <slot name="tools" />
      </div>
    </div>
    <div class="ems-chart-container__body" :style="{ minHeight: height }">
      <el-skeleton v-if="loading" animated :rows="6" />
      <div v-else-if="empty" class="ems-chart-container__empty ems-list-table__empty">
        <slot name="empty">
          <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
          <p class="ems-list-table__empty-text">{{ emptyText }}</p>
        </slot>
      </div>
      <slot v-else />
    </div>
  </div>
</template>

<script>
import tableEmptyIcon from '@/assets/images/empty.svg'

export default {
  name: 'ChartContainer',
  props: {
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    empty: {
      type: Boolean,
      default: false
    },
    emptyText: {
      type: String,
      default: '暂无数据'
    },
    height: {
      type: String,
      default: '320px'
    }
  },
  data() {
    return {
      tableEmptyIcon
    }
  }
}
</script>

<style scoped>
.ems-chart-container {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  padding: 12px 14px;
}

.ems-chart-container__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.ems-chart-container__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.ems-chart-container__subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.ems-chart-container__body {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.ems-chart-container__empty {
  flex: 1 1 auto;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
