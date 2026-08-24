<template>
  <el-select
    :value="value"
    :loading="loading"
    :placeholder="placeholder"
    :clearable="clearable"
    filterable
    :size="size"
    @change="handleChange"
  >
    <el-option
      v-if="showAll"
      :label="allLabel"
      :value="allValue"
    />
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script>
export default {
  name: 'StationSelector',
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择电站'
    },
    clearable: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'small'
    },
    showAll: {
      type: Boolean,
      default: false
    },
    allLabel: {
      type: String,
      default: '全部电站'
    },
    allValue: {
      type: [String, Number],
      default: ''
    }
  },
  methods: {
    handleChange(value) {
      this.$emit('input', value)
      this.$emit('change', value)
    }
  }
}
</script>
