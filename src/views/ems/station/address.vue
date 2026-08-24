<template>
  <div class="app-container">
    <div class="page-head">
      <div class="page-title">{{ title }}</div>
      <div class="page-actions">
        <el-button size="small" icon="el-icon-back" @click="cancel">返回</el-button>
        <el-button v-hasPermi="['ems:station:add', 'ems:station:edit']" type="primary" size="small" icon="el-icon-check" @click="submitForm">保存</el-button>
      </div>
    </div>

    <el-form ref="form" v-loading="loading" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="公司" prop="companyId">
            <company-selector v-model="form.companyId" :options="companyOptions" :clearable="false" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电站名称" prop="stationName">
            <el-input v-model="form.stationName" placeholder="请输入电站名称" maxlength="128" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="详细地址" prop="address">
        <div class="address-row">
          <el-input v-model="form.address" placeholder="请输入电站地址" maxlength="512" />
          <el-button type="primary" plain icon="el-icon-location-information" @click="mapDialogVisible = true">选择位置</el-button>
        </div>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="经度" prop="longitude">
            <el-input-number v-model="form.longitude" :precision="8" :step="0.000001" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="纬度" prop="latitude">
            <el-input-number v-model="form.latitude" :precision="8" :step="0.000001" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" maxlength="512" show-word-limit />
      </el-form-item>
    </el-form>

    <amap-location-picker-dialog
      :visible.sync="mapDialogVisible"
      :map-config="mapConfig"
      :initial-address="form.address"
      :initial-longitude="form.longitude"
      :initial-latitude="form.latitude"
      @confirm="handleLocationConfirm"
    />
  </div>
</template>

<script>
import { CompanySelector, AmapLocationPickerDialog } from '@/components/ems'
import { listCompany } from '@/api/ems/company'
import { getMapConfig } from '@/api/ems/map'
import { addStation, getStation, updateStation } from '@/api/ems/station'

export default {
  name: 'EmsStationAddress',
  components: { CompanySelector, AmapLocationPickerDialog },
  data() {
    return {
      loading: false,
      title: '新增详细地址',
      mapDialogVisible: false,
      mapConfig: {},
      companyOptions: [],
      form: {},
      rules: {
        companyId: [{ required: true, message: '公司不能为空', trigger: 'change' }],
        stationName: [{ required: true, message: '电站名称不能为空', trigger: 'blur' }]
      }
    }
  },
  computed: {
    stationId() {
      return this.$route.query.stationId ? Number(this.$route.query.stationId) : undefined
    }
  },
  created() {
    this.reset()
    this.loadCompanyOptions()
    this.loadMapConfig()
    if (this.stationId) {
      this.title = '修改详细地址'
      this.loadDetail(this.stationId)
    }
  },
  methods: {
    reset() {
      this.form = {
        stationId: undefined,
        companyId: this.$route.query.companyId ? Number(this.$route.query.companyId) : undefined,
        stationCode: undefined,
        stationName: this.$route.query.stationName,
        stationType: 'BASIC',
        country: undefined,
        timezone: undefined,
        capacityKw: undefined,
        contactName: undefined,
        contactPhone: undefined,
        address: undefined,
        longitude: undefined,
        latitude: undefined,
        runMode: 'GRID_CONNECTED',
        imageUrl: undefined,
        commissionDate: undefined,
        status: 'NORMAL',
        remark: undefined
      }
      this.resetForm('form')
    },
    loadCompanyOptions() {
      listCompany({ pageNum: 1, pageSize: 9999 }).then(response => {
        this.companyOptions = (response.data || []).map(item => ({
          label: item.companyName,
          value: item.companyId
        }))
      }).catch(() => {})
    },
    loadMapConfig() {
      getMapConfig().then(response => {
        this.mapConfig = response.data || response || {}
      })
    },
    loadDetail(stationId) {
      this.loading = true
      getStation(stationId).then(response => {
        this.form = Object.assign({}, this.form, response.data || response || {})
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleLocationConfirm(location) {
      this.$set(this.form, 'address', location.address || '')
      this.$set(this.form, 'longitude', location.longitude !== undefined && location.longitude !== null ? Number(location.longitude) : undefined)
      this.$set(this.form, 'latitude', location.latitude !== undefined && location.latitude !== null ? Number(location.latitude) : undefined)
      this.mapDialogVisible = false
    },
    normalizeCommissionDate(value) {
      if (!value) {
        return undefined
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return `${trimmed} 00:00:00`
        }
        return trimmed
      }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return value
      }
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day} 00:00:00`
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) {
          return
        }
        this.loading = true
        const payload = Object.assign({}, this.form, {
          commissionDate: this.normalizeCommissionDate(this.form.commissionDate)
        })
        const action = this.form.stationId ? updateStation : addStation
        action(payload).then(() => {
          this.$modal.msgSuccess(this.form.stationId ? '修改成功' : '新增成功')
          this.loading = false
          this.cancel()
        }).catch(() => {
          this.loading = false
        })
      })
    },
    cancel() {
      this.$router.push({ path: '/ems-station/index' })
    }
  }
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.address-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}
</style>
