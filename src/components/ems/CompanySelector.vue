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
  name: 'CompanySelector',
  props: {
    value: {
      type: [String, Number],
      default: undefined
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
      default: '请选择公司'
    },
    clearable: {
      type: Boolean,
      default: false
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
      default: '全部公司'
    },
    allValue: {
      type: [String, Number],
      default: undefined
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
