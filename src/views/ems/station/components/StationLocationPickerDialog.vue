<template>
  <amap-location-picker-dialog
    :visible.sync="dialogVisible"
    :map-config="mapConfig"
    :initial-address="initialAddress"
    :initial-longitude="initialLongitude"
    :initial-latitude="initialLatitude"
    @confirm="$emit('confirm', $event)"
  />
</template>

<script>
import { AmapLocationPickerDialog } from '@/components/ems'

/**
 * 兼容旧引用：电站选址弹窗已统一为高德地图可复用组件 AmapLocationPickerDialog
 */
export default {
  name: 'StationLocationPickerDialog',
  components: { AmapLocationPickerDialog },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mapConfig: {
      type: Object,
      default: () => ({})
    },
    initialAddress: {
      type: String,
      default: ''
    },
    initialLongitude: {
      type: [Number, String],
      default: undefined
    },
    initialLatitude: {
      type: [Number, String],
      default: undefined
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    }
  }
}
</script>
