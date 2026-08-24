<template>
  <div class="register">
    <!-- 顶部黑栏：自家 logo，无语言切换 -->
    <header class="register-header">
      <div class="register-header__brand">
        <img class="register-header__logo" src="../assets/images/login/login-logo-w.png" alt="慧知微电网">
      </div>
      <router-link class="register-header__login" :to="'/login'">
        <img class="register-header__login-icon" src="../assets/images/login/back2Login.png" alt="">
        <span>登录</span>
      </router-link>
    </header>

    <div class="register-body">
      <div class="register-notice">
        <i class="el-icon-info" />
        <span>如果您的公司在系统中已注册了账号，则无需使用此功能进行注册。请让您的管理员将您添加到用户列表。</span>
      </div>

      <div class="register-card">
        <el-form ref="registerForm" :model="registerForm" :rules="registerRules" size="small" label-width="110px" class="register-form">
          <h3 class="title">安装商注册</h3>
          <el-form-item label="公司名称" prop="companyName">
            <el-input v-model="registerForm.companyName" type="text" auto-complete="off" />
          </el-form-item>
          <el-form-item label="国家/地区" prop="country">
            <el-select v-model="registerForm.country" disabled class="register-form__control">
              <el-option label="中国" value="CN" />
            </el-select>
          </el-form-item>
          <el-form-item label="省" prop="province">
            <el-select v-model="registerForm.province" clearable placeholder="请选择" class="register-form__control">
              <el-option v-for="item in provinceOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="registerForm.username"
              type="text"
              auto-complete="off"
              placeholder="账号"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              auto-complete="new-password"
              placeholder="密码"
              show-password
              @keyup.enter.native="handleRegister"
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              auto-complete="new-password"
              placeholder="确认密码"
              show-password
              @keyup.enter.native="handleRegister"
            />
          </el-form-item>
          <el-form-item label="手机号" prop="phonenumber">
            <el-input v-model="registerForm.phonenumber" auto-complete="off" placeholder="手机号">
              <template slot="prepend">+86</template>
            </el-input>
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="registerForm.email" auto-complete="off" placeholder="邮箱" />
          </el-form-item>
          <el-form-item label="邮箱验证码" prop="emailCode" class="register-form__code-row">
            <el-input v-model="registerForm.emailCode" auto-complete="off" placeholder="邮箱验证码" class="register-form__code-input" />
            <el-button type="primary" size="small" class="email-code-button" :disabled="emailCodeSending || emailCodeCountdown > 0" @click="handleSendEmailCode">
              {{ emailCodeCountdown > 0 ? emailCodeCountdown + 's' : '获取验证码' }}
            </el-button>
          </el-form-item>
          <el-form-item v-if="captchaEnabled" label="图形验证码" prop="code" class="register-form__code-row">
            <el-input
              v-model="registerForm.code"
              auto-complete="off"
              placeholder="验证码"
              class="register-form__code-input"
              @keyup.enter.native="handleRegister"
            />
            <div class="register-code">
              <img :src="codeUrl" class="register-code-img" @click="getCode">
            </div>
          </el-form-item>
          <el-form-item prop="agreement" class="register-form__agree">
            <el-checkbox v-model="registerForm.agreement">
              我同意<span class="register-link">《用户协议》</span>，并已阅读<span class="register-link">《隐私声明》</span>
            </el-checkbox>
          </el-form-item>
          <el-form-item class="register-form__submit">
            <el-button
              :loading="loading"
              :disabled="!(
                registerForm.companyName
                && registerForm.province
                && registerForm.username
                && registerForm.password
                && registerForm.confirmPassword
                && registerForm.phonenumber
                && registerForm.email
                && registerForm.emailCode
                && registerForm.agreement
                && (!captchaEnabled || registerForm.code)
              )"
              size="small"
              class="register-submit-btn"
              @click.native.prevent="handleRegister"
            >
              <span v-if="!loading">提 交</span>
              <span v-else>提 交 中...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { getCodeImg, getRegisterStatus, register, sendRegisterEmailCode } from "@/api/login";

export default {
  name: "Register",
  data() {
    const equalToPassword = (rule, value, callback) => {
      if (this.registerForm.password !== value) {
        callback(new Error("两次输入的密码不一致"));
      } else {
        callback();
      }
    };
    return {
      codeUrl: "",
      provinceOptions: ["北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"],
      registerForm: {
        companyName: "",
        country: "CN",
        province: "",
        username: "",
        password: "",
        confirmPassword: "",
        phonenumber: "",
        email: "",
        emailCode: "",
        agreement: false,
        code: "",
        uuid: ""
      },
      registerRules: {
        companyName: [{ required: true, trigger: "blur", message: "请输入公司名称" }],
        country: [{ required: true, trigger: "change", message: "请选择国家/地区" }],
        province: [{ required: true, trigger: "change", message: "请选择省" }],
        username: [
          { required: true, trigger: "blur", message: "请输入您的账号" },
          { min: 2, max: 20, message: '用户账号长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" },
          { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ],
        confirmPassword: [
          { required: true, trigger: "blur", message: "请再次输入您的密码" },
          { required: true, validator: equalToPassword, trigger: "blur" }
        ],
        phonenumber: [
          { required: true, trigger: "blur", message: "请输入手机号" },
          { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" }
        ],
        email: [
          { required: true, trigger: "blur", message: "请输入邮箱" },
          { type: "email", message: "邮箱格式不正确", trigger: ["blur", "change"] }
        ],
        emailCode: [{ required: true, trigger: "blur", message: "请输入邮箱验证码" }],
        agreement: [{ validator: (rule, value, callback) => value ? callback() : callback(new Error("请先同意用户协议和隐私声明")), trigger: "change" }],
        code: [{ required: true, trigger: "change", message: "请输入验证码" }]
      },
      loading: false,
      emailCodeSending: false,
      emailCodeCountdown: 0,
      emailCodeTimer: null,
      captchaEnabled: true
    };
  },
  beforeDestroy() {
    if (this.emailCodeTimer) {
      clearInterval(this.emailCodeTimer);
    }
  },
  created() {
    getRegisterStatus().then(res => {
      if (!res.data || !res.data.installerEnabled) {
        this.$modal.msgWarning('当前未开放安装商自助注册');
        this.$router.replace('/login');
        return;
      }
      this.getCode();
    }).catch(() => {
      this.$router.replace('/login');
    });
  },
  methods: {
    getCode() {
      getCodeImg().then(res => {
        this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled;
        if (this.captchaEnabled) {
          this.codeUrl = "data:image/gif;base64," + res.img;
          this.registerForm.uuid = res.uuid;
        }
      });
    },
    handleSendEmailCode() {
      this.$refs.registerForm.validateField('email', error => {
        if (error) {
          return;
        }
        this.emailCodeSending = true;
        sendRegisterEmailCode(this.registerForm.email).then(() => {
          this.$modal.msgSuccess('邮箱验证码已发送');
          this.startEmailCodeCountdown();
        }).finally(() => {
          this.emailCodeSending = false;
        });
      });
    },
    startEmailCodeCountdown() {
      this.emailCodeCountdown = 60;
      if (this.emailCodeTimer) {
        clearInterval(this.emailCodeTimer);
      }
      this.emailCodeTimer = setInterval(() => {
        this.emailCodeCountdown -= 1;
        if (this.emailCodeCountdown <= 0) {
          clearInterval(this.emailCodeTimer);
          this.emailCodeTimer = null;
        }
      }, 1000);
    },
    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true;
          const registerPayload = Object.assign({}, this.registerForm, {
            accountOpenType: "INSTALLER_SELF_REGISTER",
            createDefaultInstallerAdmin: false
          });
          register(registerPayload).then(res => {
            const username = this.registerForm.username;
            this.$alert("<font color='red'>您的安装商账号 " + username + " 已注册成功，请使用账号或手机号登录。</font>", '系统提示', {
              dangerouslyUseHTMLString: true,
              type: 'success'
            }).then(() => {
              this.$router.push("/login");
            }).catch(() => {});
          }).catch(() => {
            this.loading = false;
            if (this.captchaEnabled) {
              this.getCode();
            }
          })
        }
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss">
.register {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f2f2f2;
  box-sizing: border-box;
}

.register-header {
  flex-shrink: 0;
  height: 56px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #000;
  color: #fff;
}

.register-header__brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.register-header__logo {
  height: 28px;
  width: auto;
  display: block;
  object-fit: contain;
}

.register-header__login {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: rgba(255, 255, 255, 0.85);
  }
}

.register-header__login-icon {
  width: 18px;
  height: 18px;
  display: block;
  object-fit: contain;
}

.register-body {
  flex: 1 1 auto;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 1.5rem;
  box-sizing: border-box;
}

.register-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  margin: 0 0 1.5rem;
  padding: 16px 20px;
  border: 1px solid #5990fd;
  border-radius: 12px;
  background-color: #5990fd1a;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 22px;
  box-sizing: border-box;
}

.register-notice i {
  margin-top: 1px;
  color: #5990fd;
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.register-card {
  width: 100%;
  margin: 0;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: none;
  border: 1px solid #f0f0f0;
  padding: 32px 24px 40px;
  box-sizing: border-box;
}

.title {
  margin: 0 auto 32px;
  text-align: center;
  color: rgba(0, 0, 0, 0.85);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.4;
}

.register-form {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;

  .el-form-item {
    margin-bottom: 22px;
  }

  .el-form-item__label {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 400;
    line-height: 32px;
  }

  .el-input {
    height: 32px;

    .el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      background-color: #fff !important;
    }
  }

  .el-input-group__prepend {
    background: #fafafa;
    color: rgba(0, 0, 0, 0.65);
    border-radius: 6px 0 0 6px;
    padding: 0 12px;
  }

  .el-input-group--prepend .el-input__inner {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .el-select {
    width: 100%;

    .el-input__inner {
      border-radius: 6px;
    }
  }

  .input-icon {
    height: 32px;
    width: 14px;
    margin-left: 2px;
  }
}

/* 去掉浏览器自动填充注入的黄/蓝底（用户名、密码等） */
@keyframes register-autofill-reset {
  to {
    background-color: #fff;
    color: rgba(0, 0, 0, 0.85);
  }
}

.register .el-input__inner:-webkit-autofill,
.register .el-input__inner:-webkit-autofill:hover,
.register .el-input__inner:-webkit-autofill:focus,
.register .el-input__inner:-webkit-autofill:active,
.register input.el-input__inner:-webkit-autofill,
.register input.el-input__inner:-webkit-autofill:hover,
.register input.el-input__inner:-webkit-autofill:focus,
.register input.el-input__inner:-webkit-autofill:active,
.register input:-webkit-autofill,
.register input:-webkit-autofill:hover,
.register input:-webkit-autofill:focus,
.register input:-webkit-autofill:active {
  -webkit-text-fill-color: rgba(0, 0, 0, 0.85) !important;
  caret-color: rgba(0, 0, 0, 0.85) !important;
  color: rgba(0, 0, 0, 0.85) !important;
  background-color: #fff !important;
  background-image: none !important;
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  box-shadow: 0 0 0 1000px #fff inset !important;
  transition: background-color 99999s ease-in-out 0s !important;
  animation-name: register-autofill-reset;
  animation-fill-mode: both;
}

.register-form__control {
  width: 100%;
}

.register-form__code-row {
  .el-form-item__content {
    display: flex;
    align-items: center;
  }
}

.register-form__code-input {
  flex: 1 1 auto;
  min-width: 0;
}

.email-code-button {
  flex-shrink: 0;
  width: 94px;
  margin-left: 12px;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  background-color: rgb(10, 89, 247) !important;
  border-color: rgb(10, 89, 247) !important;
  color: #fff !important;

  &:hover,
  &:focus {
    background-color: rgb(40, 110, 250) !important;
    border-color: rgb(40, 110, 250) !important;
    color: #fff !important;
  }

  &.is-disabled,
  &[disabled] {
    background-color: rgb(10, 89, 247) !important;
    border-color: rgb(10, 89, 247) !important;
    color: #fff !important;
    opacity: 0.55;
  }
}

.register-code {
  flex-shrink: 0;
  width: 94px;
  height: 32px;
  margin-left: 12px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-sizing: border-box;
}

.register-code-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  vertical-align: top;
}

.register-form__agree {
  margin-bottom: 24px;

  .el-form-item__content {
    line-height: 1.5;
  }

  .el-checkbox__label {
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
    white-space: normal;
  }
}

.register-link {
  color: #1890ff;
}

.register-form__submit {
  margin-top: 0;
  margin-bottom: 0;

  .el-form-item__content {
    margin-left: 110px !important;
  }
}

.register-submit-btn.el-button {
  width: 100%;
  max-width: 100%;
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  letter-spacing: 2px;
  background-color: rgb(243, 243, 244);
  border: 1px solid rgb(201, 201, 201);
  color: rgba(0, 0, 0, 0.45);
  margin-top: 14px;

  &.is-disabled,
  &[disabled] {
    background-color: rgb(243, 243, 244) !important;
    border-color: rgb(201, 201, 201) !important;
    color: rgba(0, 0, 0, 0.25) !important;
    opacity: 1;
  }

  &:not(.is-disabled):not([disabled]) {
    background-color: rgb(10, 89, 247) !important;
    border-color: rgb(10, 89, 247) !important;
    color: #fff !important;

    &:hover,
    &:focus {
      background-color: rgb(40, 110, 250) !important;
      border-color: rgb(40, 110, 250) !important;
      color: #fff !important;
    }
  }
}

@media (max-width: 640px) {
  .register-header {
    padding: 0 16px;
  }

  .register-body {
    padding: 1.5rem;
  }

  .register-card {
    padding: 24px 12px 28px;
  }

  .register-form {
    max-width: 100%;
  }

  .register-form__submit .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>
