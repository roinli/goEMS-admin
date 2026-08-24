<template>
  <div class="app-container station-create-page nco-settings-container">
    <div class="new-style-menu-title">{{ title }}</div>
    <div class="nco-settings-container-content station-create-content">
      <!-- <div class="station-create-alert" role="alert">
        <i class="el-icon-info station-create-alert__icon" aria-hidden="true" />
        <div class="station-create-alert__message">
          当前“投运日期”按原型主字段使用，并统一作为站点并网投运日期保存。
        </div>
      </div> -->

      <el-form ref="form" v-loading="loading" :model="form" :rules="rules" label-width="110px" :disabled="isDetail">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所属公司" prop="companyId">
            <company-selector v-model="form.companyId" :options="companyOptions" :clearable="false" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电站类型" prop="stationType">
            <el-select v-model="form.stationType" placeholder="请选择电站类型" style="width: 100%">
              <el-option label="基础站" value="BASIC" />
              <el-option label="接入站" value="ACCESS" />
              <el-option label="组串站" value="STRING" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="电站编码" prop="stationCode">
            <el-input v-model="form.stationCode" placeholder="请输入电站编码" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电站名称" prop="stationName">
            <el-input v-model="form.stationName" placeholder="请输入电站名称" maxlength="128" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="国家/地区" prop="country">
            <el-input v-model="form.country" placeholder="请输入国家或地区" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时区" prop="timezone">
            <el-input v-model="form.timezone" placeholder="请输入时区，例如上海时区" maxlength="64" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="装机容量(kW)" prop="capacityKw">
            <el-input-number v-model="form.capacityKw" :precision="2" :min="0" controls-position="right" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="投运日期" prop="commissionDate">
            <el-date-picker v-model="form.commissionDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width: 100%;" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contactName">
            <el-input v-model="form.contactName" placeholder="请输入联系人" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="请输入联系电话" maxlength="32" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="电站地址" prop="address">
        <div class="address-row">
          <el-input v-model="form.address" placeholder="请输入电站地址" maxlength="512" />
          <el-button
            v-if="!isDetail"
            type="primary"
            icon="el-icon-location-information"
            @click="mapDialogVisible = true"
          >选择位置</el-button>
        </div>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="经度" prop="longitude">
            <el-input-number v-model="form.longitude" :precision="8" :step="0.000001" controls-position="right" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="纬度" prop="latitude">
            <el-input-number v-model="form.latitude" :precision="8" :step="0.000001" controls-position="right" style="width: 100%;" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="运行模式" prop="runMode">
            <el-select v-model="form.runMode" placeholder="请选择运行模式" style="width: 100%">
              <el-option label="并网" value="GRID_CONNECTED" />
              <el-option label="离网" value="OFF_GRID" />
              <el-option label="混合" value="HYBRID" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="正常" value="NORMAL" />
              <el-option label="停用" value="DISABLED" />
              <el-option label="建设中" value="CONSTRUCTION" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" maxlength="512" show-word-limit />
      </el-form-item>

      <el-form-item label="站点图片" prop="imageUrl">
        <div v-if="isDetail" class="station-image-readonly">
          <img v-if="form.imageUrl" :src="form.imageUrl" alt="站点图片" class="station-image-readonly__img">
          <span v-else class="station-image-readonly__empty">暂无图片</span>
        </div>
        <image-upload
          v-else
          v-model="form.imageUrl"
          class="station-image-upload"
          :limit="1"
          :file-size="5"
          :is-show-tip="false"
          :file-type="['png', 'jpg', 'jpeg', 'webp']"
        />
      </el-form-item>
    </el-form>

      <div class="page-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button
          v-if="!isDetail"
          v-hasPermi="['ems:station:add', 'ems:station:edit']"
          type="primary"
          @click="submitForm"
        >确定</el-button>
      </div>

    <amap-location-picker-dialog
      :visible.sync="mapDialogVisible"
      :map-config="mapConfig"
      :initial-address="form.address"
      :initial-longitude="form.longitude"
      :initial-latitude="form.latitude"
      @confirm="handleLocationConfirm"
    />
    </div>
  </div>
</template>

<script>
import { CompanySelector, AmapLocationPickerDialog } from '@/components/ems'
import { addStation, getStation, updateStation } from '@/api/ems/station'
import { listCompany } from '@/api/ems/company'
import { getMapConfig } from '@/api/ems/map'

export default {
  name: 'EmsStationCreate',
  components: { CompanySelector, AmapLocationPickerDialog },
  data() {
    return {
      loading: false,
      title: '新增电站',
      isDetail: false,
      mapDialogVisible: false,
      mapConfig: {},
      companyOptions: [],
      form: {},
      rules: {
        companyId: [{ required: true, message: '公司不能为空', trigger: 'change' }],
        stationCode: [{ required: true, message: '电站编码不能为空', trigger: 'blur' }],
        stationName: [{ required: true, message: '电站名称不能为空', trigger: 'blur' }],
        stationType: [{ required: true, message: '电站类型不能为空', trigger: 'change' }]
      }
    }
  },
  created() {
    this.reset()
    this.applyRouteQuery()
    this.loadCompanyOptions()
    this.loadMapConfig()
    const stationId = this.$route.query.stationId
    this.isDetail = this.$route.query.mode === 'detail'
    if (stationId) {
      this.title = this.isDetail ? '电站详情' : '修改电站'
      this.loading = true
      getStation(stationId).then(response => {
        this.form = Object.assign({}, this.form, response.data || response)
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    }
  },
  methods: {
    applyRouteQuery() {
      if (!this.$route || !this.$route.query) {
        return
      }
      if (this.$route.query.companyId && !this.form.companyId) {
        this.form.companyId = Number(this.$route.query.companyId)
      }
    },
    reset() {
      this.form = {
        stationId: undefined,
        companyId: undefined,
        stationCode: undefined,
        stationName: undefined,
        stationType: 'BASIC',
        country: undefined,
        timezone: 'Asia/Shanghai',
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
      if (this.isDetail) return
      this.$refs['form'].validate(valid => {
        if (!valid) return
        this.loading = true
        const action = this.form.stationId ? updateStation : addStation
        const payload = Object.assign({}, this.form, {
          commissionDate: this.normalizeCommissionDate(this.form.commissionDate)
        })
        action(payload).then(() => {
          this.$modal.msgSuccess(this.form.stationId ? '修改成功' : '新增成功')
          this.loading = false
          this.$router.push({ path: '/ems-station/index' })
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
.station-create-page.nco-settings-container {
  min-height: calc(100vh - 4rem);
}

.station-create-content {
  min-width: 0;
}

.page-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}

.page-footer .el-button + .el-button {
  margin-left: 16px;
}

.page-footer .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.page-footer .el-button--primary:hover,
.page-footer .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}

.station-create-content ::v-deep .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.station-create-alert {
  display: flex;
  align-items: flex-start;
  box-sizing: border-box;
  margin: 0 0 16px;
  padding: 15px 19px;
  border: 1px solid #5990fd;
  border-radius: 12px;
  background-color: rgba(89, 144, 253, 0.1);
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  word-wrap: break-word;
}

.station-create-alert__icon {
  flex-shrink: 0;
  margin-right: 12px;
  color: #5990fd;
  font-size: 20px;
  line-height: 1;
}

.station-create-alert__message {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.85);
}

.address-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.station-image-readonly__img {
  display: block;
  width: 148px;
  height: 148px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5eaf3;
}

.station-image-readonly__empty {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.station-image-upload ::v-deep .el-upload--picture-card {
  width: 104px;
  height: 104px;
  line-height: 104px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  color: rgba(0, 0, 0, 0.45);
}

.station-image-upload ::v-deep .el-upload--picture-card:hover {
  border-color: #0a59f7;
  color: #0a59f7;
}

.station-image-upload ::v-deep .el-upload--picture-card i {
  font-size: 24px;
  color: inherit;
}

.station-image-upload ::v-deep .el-upload-list--picture-card .el-upload-list__item {
  width: 104px;
  height: 104px;
  margin: 0 8px 0 0;
  border-radius: 6px;
}

.station-image-upload ::v-deep .el-upload__tip {
  display: none;
}
</style>
