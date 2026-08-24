<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="公司名称" prop="companyName">
          <el-input v-model="form.companyName" placeholder="请输入公司名称" maxlength="128" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="父公司" prop="parentId">
          <treeselect
            v-model="form.parentId"
            :options="parentOptions"
            :normalizer="companyNormalizer"
            :show-count="true"
            clearable
            placeholder="请选择父公司，不选则为顶级公司"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="公司描述" prop="companyDesc">
          <el-input v-model="form.companyDesc" placeholder="请输入公司描述" maxlength="512" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="公司地址" prop="address">
          <div class="address-row">
            <el-input v-model="form.address" placeholder="请输入公司地址" maxlength="512" />
            <el-button type="primary" icon="el-icon-location-information" @click="$emit('pick-location')">选择位置</el-button>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
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
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="国家/地区" prop="country">
          <el-input v-model="form.country" placeholder="请输入国家/地区" maxlength="64" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="省" prop="province">
          <el-input v-model="form.province" placeholder="请输入省" maxlength="64" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="市" prop="city">
          <el-input v-model="form.city" placeholder="请输入市" maxlength="64" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="官网" prop="website">
          <el-input v-model="form.website" placeholder="请输入官网" maxlength="256" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="备案号" prop="recordNo">
          <el-input v-model="form.recordNo" placeholder="请输入备案号" maxlength="128" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in dictOptions" :key="dict.value" :label="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="备注" prop="remark">
      <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" maxlength="512" show-word-limit />
    </el-form-item>
  </div>
</template>

<script>
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

export default {
  name: 'CompanyFormFields',
  components: { Treeselect },
  props: {
    form: { type: Object, required: true },
    parentOptions: { type: Array, default: () => [] },
    dictOptions: { type: Array, default: () => [] }
  },
  methods: {
    companyNormalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return node
    }
  }
}
</script>

<style scoped>
.address-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.address-row .el-input {
  flex: 1;
}

.el-input-number >>> .el-input__inner {
  text-align: left;
}
</style>