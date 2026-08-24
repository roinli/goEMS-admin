<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true" size="small" class="search-form">
      <el-form-item label="设备名称">
        <el-input
          v-model="keyword"
          clearable
          placeholder="请输入设备名称"
          @keyup.enter.native="load"
        />
      </el-form-item>
      <el-form-item label="所属电站">
        <el-select
          v-model="queryParams.stationId"
          clearable
          filterable
          placeholder="请选择电站"
          @change="load"
        >
          <el-option
            v-for="item in stationOptions"
            :key="item.stationId"
            :label="item.stationName"
            :value="item.stationId"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button v-hasPermi="['ems:device:add']" type="primary" icon="el-icon-plus" @click="openAdd">新增设备</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="filteredRows" border stripe>
      <el-table-column prop="deviceName" label="设备名称" min-width="160" />
      <el-table-column prop="deviceCode" label="设备编码" min-width="150" />
      <el-table-column prop="deviceType" label="设备类型" width="120" />
      <el-table-column prop="stationName" label="所属电站" min-width="160" />
      <el-table-column prop="commStatus" label="通讯状态" width="110" />
      <el-table-column label="操作" width="160" fixed="right">
        <template slot-scope="scope">
          <el-button v-hasPermi="['ems:device:edit']" type="text" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['ems:device:remove']" type="text" class="danger" @click="remove(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="editing ? '编辑设备' : '新增设备'" :visible.sync="dialogVisible" width="520px">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="form.deviceName" />
        </el-form-item>
        <el-form-item label="设备编码" prop="deviceCode">
          <el-input v-model="form.deviceCode" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="form.deviceType" style="width: 100%">
            <el-option
              v-for="type in types"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属电站" prop="stationId">
          <el-select v-model="form.stationId" filterable style="width: 100%" @change="handleStationChange">
            <el-option
              v-for="item in stationOptions"
              :key="item.stationId"
              :label="item.stationName"
              :value="item.stationId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listDevice, addDevice, updateDevice, delDevice } from '@/api/ems/device'
import { loadStations } from '@/api/ems/mockTelemetry'

export default {
  name: 'EmsDeviceIndex',
  data() {
    return {
      rows: [],
      stationOptions: [],
      queryParams: {
        stationId: undefined,
        pageNum: 1,
        pageSize: 9999
      },
      keyword: '',
      loading: false,
      dialogVisible: false,
      editing: false,
      form: {},
      types: [
        { label: '逆变器', value: 'INVERTER' },
        { label: '储能系统', value: 'ESS' },
        { label: '电表', value: 'METER' },
        { label: '负载', value: 'LOAD' },
        { label: '其他', value: 'OTHER' }
      ],
      rules: {
        deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
        deviceCode: [{ required: true, message: '设备编码不能为空', trigger: 'blur' }],
        deviceType: [{ required: true, message: '设备类型不能为空', trigger: 'change' }],
        stationId: [{ required: true, message: '所属电站不能为空', trigger: 'change' }]
      }
    }
  },
  computed: {
    filteredRows() {
      return this.rows.filter(item => !this.keyword || String(item.deviceName || '').indexOf(this.keyword) !== -1)
    }
  },
  created() {
    this.loadStationOptions()
    this.load()
  },
  methods: {
    loadStationOptions() {
      loadStations().then(rows => {
        this.stationOptions = rows
      })
    },
    load() {
      this.loading = true
      listDevice(this.queryParams).then(res => {
        this.rows = res.data || []
        this.loading = false
      }).catch(() => {
        this.rows = []
        this.loading = false
      })
    },
    resetQuery() {
      this.queryParams.stationId = undefined
      this.keyword = ''
      this.load()
    },
    openAdd() {
      const station = this.stationOptions.find(item => String(item.stationId) === String(this.queryParams.stationId)) || this.stationOptions[0]
      this.editing = false
      this.form = {
        deviceName: '',
        deviceCode: `LOCAL-${Date.now()}`,
        deviceType: 'OTHER',
        stationId: station && station.stationId,
        companyId: station && station.companyId
      }
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editing = true
      this.form = Object.assign({}, row)
      this.dialogVisible = true
    },
    handleStationChange(stationId) {
      const station = this.stationOptions.find(item => String(item.stationId) === String(stationId))
      if (station) this.form.companyId = station.companyId
    },
    save() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const station = this.stationOptions.find(item => String(item.stationId) === String(this.form.stationId))
        if (station) this.form.companyId = station.companyId
        const action = this.editing ? updateDevice : addDevice
        action(this.form).then(() => {
          this.dialogVisible = false
          this.load()
          this.$message.success('保存成功')
        }).catch(() => {})
      })
    },
    remove(row) {
      this.$confirm('确认删除该设备？', '提示').then(() => {
        delDevice(row.deviceId).then(() => {
          this.load()
          this.$message.success('删除成功')
        })
      })
    }
  }
}
</script>

<style scoped>
.search-form {
  margin-bottom: 12px;
}

.danger {
  color: #f56c6c;
}
</style>
