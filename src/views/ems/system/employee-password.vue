<template>
  <div class="app-container">
    <div class="page-head">
      <div class="page-title">重置员工密码</div>
      <div class="page-actions">
        <el-button size="small" icon="el-icon-back" @click="cancel">返回</el-button>
        <el-button v-hasPermi="['ems:employee:resetPwd']" type="primary" size="small" icon="el-icon-check" @click="submitForm">保存</el-button>
      </div>
    </div>

    <el-form ref="form" v-loading="loading" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户名">
            <el-input :value="userInfo.userName || '--'" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号">
            <el-input :value="userInfo.phonenumber || '--'" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="新密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入新密码" maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" maxlength="30" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="快捷操作">
        <el-button size="small" @click="applyDefaultPassword">恢复默认密码 {{ defaultPassword }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { getEmployee } from '@/api/ems/employee'
import { resetUserPwd } from '@/api/system/user'

const DEFAULT_EMPLOYEE_PASSWORD = '123456'

export default {
  name: 'EmsSystemEmployeePassword',
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入新密码'))
        return
      }
      if (value !== this.form.password) {
        callback(new Error('两次输入的密码不一致'))
        return
      }
      callback()
    }
    return {
      loading: false,
      userInfo: {},
      form: {
        password: '',
        confirmPassword: ''
      },
      defaultPassword: DEFAULT_EMPLOYEE_PASSWORD,
      rules: {
        password: [{ required: true, message: '新密码不能为空', trigger: 'blur' }],
        confirmPassword: [{ validator: validateConfirmPassword, trigger: ['blur', 'change'] }]
      }
    }
  },
  computed: {
    userId() {
      return this.$route.query.userId ? Number(this.$route.query.userId) : undefined
    }
  },
  created() {
    if (this.userId) {
      this.loadDetail(this.userId)
    }
  },
  methods: {
    loadDetail(userId) {
      this.loading = true
      getEmployee(userId).then(response => {
        this.userInfo = response.data || response || {}
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    applyDefaultPassword() {
      this.form.password = DEFAULT_EMPLOYEE_PASSWORD
      this.form.confirmPassword = DEFAULT_EMPLOYEE_PASSWORD
    },
    submitForm() {
      if (!this.userId) {
        this.$modal.msgError('缺少员工标识，无法重置密码')
        return
      }
      this.$refs['form'].validate(valid => {
        if (!valid) {
          return
        }
        this.loading = true
        resetUserPwd(this.userId, this.form.password).then(() => {
          this.$modal.msgSuccess('密码重置成功')
          this.loading = false
          this.cancel()
        }).catch(() => {
          this.loading = false
        })
      })
    },
    cancel() {
      this.$router.push({ path: '/ems-system/employee' })
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
</style>
