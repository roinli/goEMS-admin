<template>
  <el-select
    :value="value"
    :loading="loading"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
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
      v-for="item in tenantOptions"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script>
import { listTenant } from '@/api/system/tenant'
import { getInfo } from '@/api/login'
import { getTenant, setTenant } from '@/utils/auth'

const DEFAULT_EXCLUDE_IDS = [9999]

function normalizeTenantId(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const tenantId = Number(value)
  return Number.isNaN(tenantId) ? undefined : tenantId
}

export default {
  name: 'TenantSelector',
  props: {
    value: {
      type: [String, Number],
      default: undefined
    },
    placeholder: {
      type: String,
      default: '请选择租户'
    },
    clearable: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'small'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    currentLabel: {
      type: String,
      default: '当前租户'
    },
    showAll: {
      type: Boolean,
      default: false
    },
    allLabel: {
      type: String,
      default: '全部租户'
    },
    allValue: {
      type: [String, Number],
      default: undefined
    },
    excludeIds: {
      type: Array,
      default: () => DEFAULT_EXCLUDE_IDS.slice()
    }
  },
  data() {
    return {
      loading: false,
      isAdmin: false,
      tenantOptions: []
    }
  },
  created() {
    this.isAdmin = Array.isArray(this.$store.getters.roles) && this.$store.getters.roles.includes('admin')
    this.loadTenants()
  },
  methods: {
    loadTenants() {
      if (!this.isAdmin) {
        const currentTenantId = normalizeTenantId(this.value || getTenant())
        const syncCurrentTenant = (tenantName) => {
          this.tenantOptions = currentTenantId === undefined ? [] : [{
            value: currentTenantId,
            label: tenantName || this.currentLabel
          }]
          if (currentTenantId !== undefined && this.value !== currentTenantId) {
            this.$emit('input', currentTenantId)
          }
        }
        return getInfo().then(response => {
          syncCurrentTenant(response.tenantName || (response.user && response.user.tenantName))
        }).catch(() => {
          syncCurrentTenant()
        })
      }
      this.loading = true
      return listTenant({ pageNum: 1, pageSize: 9999 }).then(response => {
        const payload = response.data || response || {}
        const rows = Array.isArray(payload) ? payload : (payload.rows || payload.list || payload.records || [])
        const excluded = new Set((this.excludeIds || []).map(item => Number(item)))
        const options = rows
          .map(item => ({
            value: normalizeTenantId(item.id || item.tenantId),
            label: item.tenantName || item.tenant_name || `租户-${item.id || item.tenantId}`
          }))
          .filter(item => item.value !== undefined && !excluded.has(item.value))

        this.tenantOptions = options
        const currentValue = normalizeTenantId(this.value || getTenant())
        const selected = options.some(item => item.value === currentValue)
          ? currentValue
          : (options[0] && options[0].value)
        if (selected !== undefined && selected !== null && selected !== currentValue) {
          setTenant(String(selected))
          this.$emit('input', selected)
          this.$emit('change', selected)
        } else if (selected !== undefined && selected !== null && this.value !== selected) {
          this.$emit('input', selected)
        }
      }).finally(() => {
        this.loading = false
      })
    },
    handleChange(value) {
      const nextValue = normalizeTenantId(value)
      if (nextValue !== undefined) {
        setTenant(String(nextValue))
      }
      this.$emit('input', nextValue)
      this.$emit('change', nextValue)
    }
  }
}
</script>
