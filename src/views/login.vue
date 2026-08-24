<template>
  <div class="ems-login">
    <div class="ems-login__bg" />

    <div class="ems-login__qr">
      <div class="ems-login__qr-item">
        <img src="../assets/images/login/wechat.png" alt="二维码">
      </div>
      <div class="ems-login__qr-item">
        <img src="../assets/images/login/jh.jpg" alt="二维码">
      </div>
    </div>

    <div class="ems-login__logo">
      <img src="../assets/images/login/login-logo-w.png" class="ems-login__logo-img" alt="">
      <!-- <div class="ems-login__logo-title">慧知微电网</div> -->
    </div>

    <div class="ems-login__form-area">
      <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="ems-login__form" @submit.native.prevent>
        <div class="ems-login__error">{{ loginError }}</div>

        <div class="ems-login__row">
          <div class="ems-login__inputs">
            <div class="ems-login__field ems-login__field--user">
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  type="text"
                  auto-complete="off"
                  placeholder="用户名"
                  class="ems-login__input"
                >
                  <img slot="prefix" src="../assets/images/login/user.png" class="ems-login__icon ems-login__icon--user" alt="">
                </el-input>
              </el-form-item>
            </div>

            <div class="ems-login__field ems-login__field--pwd">
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  auto-complete="off"
                  placeholder="密码"
                  class="ems-login__input"
                  @keyup.enter.native="handleLogin"
                >
                  <img slot="prefix" src="../assets/images/login/password2.png" class="ems-login__icon ems-login__icon--pwd" alt="">
                </el-input>
              </el-form-item>
            </div>
          </div>

          <el-form-item class="ems-login__btn-item">
            <el-button
              type="primary"
              class="ems-login__btn"
              @click.native.prevent="handleLogin"
            >
              <span>登录</span>
            </el-button>
          </el-form-item>
        </div>

        <el-checkbox v-model="loginForm.rememberMe" class="ems-login__remember">记住密码</el-checkbox>
      </el-form>
    </div>

    <div v-if="register" class="ems-login__ops">
      <router-link class="ems-login__ops-link" :to="'/register'">安装商注册</router-link>
    </div>

    <div class="ems-login__footer">
      版权所有 COPYRIGHT 2019-2026 慧知微电网. All Rights Reserved. 技术支持：慧知EMS能源管理平台
    </div>
  </div>
</template>

<script>
import { getCodeImg, getRegisterStatus } from '@/api/login'
import Cookies from 'js-cookie'
import { encrypt, decrypt } from '@/utils/jsencrypt'
import logoImg from '@/assets/logo/logo.png'

export default {
  name: 'Login',
  data() {
    return {
      logo: logoImg,
      codeUrl: '',
      loginForm: {
        username: '',
        password: '',
        rememberMe: false,
        code: '',
        uuid: ''
      },
      loginRules: {
        username: [
          { required: true, trigger: 'blur', message: '请输入用户名' }
        ],
        password: [
          { required: true, trigger: 'blur', message: '请输入密码' }
        ],
        code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
      },
      loading: false,
      captchaEnabled: true,
      register: false,
      redirect: undefined,
      loginError: '',
      loginErrorTimer: null
    }
  },
  watch: {
    $route: {
      handler(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    this.getCode()
    this.getCookie()
    this.getRegisterStatus()
  },
  mounted() {
    document.documentElement.classList.add('ems-login-rem')
  },
  beforeDestroy() {
    document.documentElement.classList.remove('ems-login-rem')
    this.clearLoginErrorTimer()
  },
  methods: {
    clearLoginErrorTimer() {
      if (this.loginErrorTimer) {
        clearTimeout(this.loginErrorTimer)
        this.loginErrorTimer = null
      }
    },
    showLoginError(message) {
      const text = (message && String(message).trim()) || '登录失败，请输入正确的用户名和密码。'
      this.clearLoginErrorTimer()
      this.loginError = text
      this.loginErrorTimer = setTimeout(() => {
        this.loginError = ''
        this.loginErrorTimer = null
      }, 15000)
    },
    getRegisterStatus() {
      getRegisterStatus().then(res => {
        this.register = Boolean(res.data && res.data.installerEnabled)
      }).catch(() => {
        this.register = false
      })
    },
    getCode() {
      getCodeImg().then(res => {
        this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled
        if (this.captchaEnabled) {
          this.codeUrl = 'data:image/gif;base64,' + res.img
          this.loginForm.uuid = res.uuid
        }
      })
    },
    getCookie() {
      const username = Cookies.get('username')
      const password = Cookies.get('password')
      const rememberMe = Cookies.get('rememberMe')
      this.loginForm = {
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe),
        code: this.loginForm.code,
        uuid: this.loginForm.uuid
      }
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid, invalidFields) => {
        if (!valid) {
          const firstKey = invalidFields && Object.keys(invalidFields)[0]
          const firstError = firstKey && invalidFields[firstKey] && invalidFields[firstKey][0]
          this.showLoginError((firstError && firstError.message) || '请完善登录信息')
          return
        }
        this.loading = true
        if (this.loginForm.rememberMe) {
          Cookies.set('username', this.loginForm.username, { expires: 30 })
          Cookies.set('password', encrypt(this.loginForm.password), { expires: 30 })
          Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 })
        } else {
          Cookies.remove('username')
          Cookies.remove('password')
          Cookies.remove('rememberMe')
        }
        this.$store.dispatch('Login', this.loginForm).then(() => {
          this.clearLoginErrorTimer()
          this.loginError = ''
          this.$router.push({ path: this.redirect || '/ems-home/list' }).catch(() => {})
        }).catch(err => {
          this.loading = false
          const msg = (err && err.message) || (typeof err === 'string' && err !== 'error' ? err : '') || '登录失败，请输入正确的用户名和密码。'
          this.showLoginError(msg)
          if (this.captchaEnabled) {
            this.getCode()
          }
        })
      })
    }
  }
}
</script>

<style>
html.ems-login-rem {
  font-size: 16px !important;
}

@media (max-width: 1441px) {
  html.ems-login-rem,
  html.ems-login-rem body {
    font-size: 12px !important;
  }
}

@media (min-width: 1442px) and (max-width: 1739px) {
  html.ems-login-rem,
  html.ems-login-rem body {
    font-size: 14px !important;
  }
}

@media (min-width: 1740px) {
  html.ems-login-rem,
  html.ems-login-rem body {
    font-size: 16px !important;
  }
}
</style>

<style lang="scss" scoped>
.ems-login {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.ems-login__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: url('../assets/images/login/loginBackground.png') center center / 100% 100% no-repeat;
}

.ems-login__qr {
  position: fixed;
  z-index: 3;
  top: 5.6%;
  right: 1.4%;
  display: flex;
  gap: 0.5rem;
  justify-content: space-around;
}

.ems-login__qr-item {
  text-align: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;

  img {
    width: 96px;
    height: 96px;
    display: block;
    object-fit: cover;
    background: #fff;
  }
}

.ems-login__logo {
  position: relative;
  z-index: 2;
  display: flex;
  margin-top: 14rem;
  justify-content: center;
  align-items: center;
  margin-left: -0.5rem;
}

.ems-login__logo-img {
  /*height: 6rem;*/
  height: 72px;
  width: auto;
  object-fit: contain;
  display: block;
}

.ems-login__logo-title {
  font-size: 2.25rem;
  color: #0A79F0;
  margin-top: 1rem;
  margin-left: 1.8rem;
}

.ems-login__form-area {
  width: 100%;
  min-width: 530px;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 33.2% !important;
  left: 2% !important;
  box-sizing: border-box;
  margin-top: 0 !important;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  background: transparent;
  background-size: 100% 100%;
  outline-width: 0;
  outline-style: none;
  outline-color: #585858;
  text-size-adjust: 100%;
  position: fixed !important;
  box-shadow: none !important;
  color: #C1C1C1;
  margin-left: auto;
  margin-right: auto;
  z-index: 3;
}

.ems-login__form {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  ::v-deep .el-form-item {
    margin-bottom: 0;
  }

  ::v-deep .el-form-item__content {
    margin-left: 0 !important;
    line-height: normal;
  }

  ::v-deep .el-form-item__error {
    display: none;
  }
}

.ems-login__error {
  width: 42.5rem;
  max-width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  height: 2.1rem;
  margin: 0.5rem 0;
  padding: 0;
  color: red;
  font-size: 1rem;
  text-align: left;
  word-break: break-all;
  overflow: hidden;
  padding-left: 10px;
}

.ems-login__row {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.ems-login__inputs {
  display: flex;
  align-items: stretch;
  height: 2.5rem;
}

.ems-login__field {
  height: 2.5rem;

  ::v-deep .el-form-item,
  ::v-deep .el-form-item__content,
  ::v-deep .el-input,
  ::v-deep .el-input__inner {
    height: 2.5rem;
  }

  ::v-deep .el-input__inner {
    background: transparent;
    border: none !important;
    box-shadow: none !important;
    font-size: 1rem !important;
    line-height: 1.25rem;
    height: 2.5rem;
    padding-left: 3rem;
    padding-right: 1rem;
    color: #212121;
    border-radius: 0;

    &::placeholder {
      font-size: 1rem !important;
      color: #999;
    }
  }

  ::v-deep .el-input__prefix {
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.ems-login__field--user {
  width: 22.75rem;
  border-radius: 3rem 0 0 3rem;
  background: #fff !important;

  ::v-deep .el-input__inner {
    border-radius: 3rem 0 0 3rem;
    background: #fff !important;

    &:hover,
    &:focus {
      background: #fff !important;
    }

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus {
      -webkit-text-fill-color: #212121;
      -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
      box-shadow: 0 0 0 1000px #fff inset !important;
      transition: background-color 99999s ease-out;
    }
  }
}

.ems-login__field--pwd {
  width: 20.75rem;
  border-radius: 0 3rem 3rem 0;
  margin-left: -0.3rem;
  background: #f7f7f7 !important;

  ::v-deep .el-input__inner {
    border-radius: 0 3rem 3rem 0;
    background: #f7f7f7 !important;

    &:hover,
    &:focus {
      background: #f7f7f7 !important;
    }

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus {
      -webkit-text-fill-color: #212121;
      -webkit-box-shadow: 0 0 0 1000px #f7f7f7 inset !important;
      box-shadow: 0 0 0 1000px #f7f7f7 inset !important;
      transition: background-color 99999s ease-out;
    }
  }
}

.ems-login__icon {
  object-fit: contain;
  opacity: 0.7;
}

.ems-login__icon--user {
  width: 1.25rem;
  height: 1.25rem;
  margin-left: 1.1rem;
}

.ems-login__icon--pwd {
  width: 1.5rem;
  height: 0.75rem;
  margin-left: 1rem;
}

.ems-login__btn-item {
  margin: 0 !important;
}

.ems-login__btn {
  background-color: #007dff;
  border: none !important;
  color: #fff !important;
  font-size: 1rem !important;
  font-weight: normal !important;
  border-radius: 3rem !important;
  padding: 0 2rem !important;
  height: 2.5rem !important;
  line-height: 2.5rem !important;
  min-width: auto;
  box-shadow: none;

  span {
    font-size: 1rem;
    height: 2.5rem;
    line-height: 2.5rem;
  }

  &:hover,
  &:active {
    background-color: #85CCFF;
    border-radius: 0.125rem;
    color: #fff;
    font-size: 1.25rem !important;
    cursor: pointer;
    width: 100%;
  }

  &:focus {
    background-color: #186FC2;
    border-radius: 0.125rem;
    color: #fff;
    font-size: 1.25rem !important;
    cursor: pointer;
    width: 100%;
    outline: 2px dotted #186FC2;
    outline-offset: 2px;
  }
}

.ems-login__remember {
  display: none;
}

.ems-login__ops {
  position: fixed;
  z-index: 2;
  top: 49.5%;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  font-size: 1rem;
  color: #333;
  white-space: nowrap;
}

.ems-login__ops-link {
  color: #333;
  text-decoration: none;
  font-size: 1rem;

  &:hover {
    color: #1b8adb;
    border-bottom: 1px solid #1b8adb;
  }
}

.ems-login__footer {
  position: absolute;
  z-index: 2;
  bottom: 4%;
  left: 0;
  width: 100%;
  font-size: 0.75rem;
  color: #fff;
  opacity: 0.8;
  text-align: center;
  line-height: 1.5;
  padding: 0 1rem;
  box-sizing: border-box;
}

@media (max-width: 1441px) {
  .ems-login__form-area {
    top: 36.5% !important;
    left: 2% !important;
  }

  .ems-login__ops {
    top: 60.5%;
  }

  .ems-login__qr {
    
  }
}

@media (min-width: 1442px) and (max-width: 1739px) {
  .ems-login__form-area {
    top: 32.5% !important;
    left: 2% !important;
  }
}

@media (min-width: 1740px) {
  .ems-login__form-area {
    top: 32.5% !important;
    left: 2% !important;
  }

  .ems-login__ops {
    top: 60.5%;
  }
}

@media (min-width: 1921px) {
  .ems-login__form-area {
    top: 33.5%;
  }
}

@media (max-width: 960px) {
  .ems-login__logo{
    margin-top: 20rem;
  }

  .ems-login__form-area {
    position: relative;
    top: 40% !important;
    left: 0% !important;
    min-width: 403px;
  }

  .ems-login__ops {
    position: relative;
    top: 25.5%;
  }

  .ems-login__row {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .ems-login__inputs {
    width: 100%;
    height: auto;
    flex-direction: column;
    border-radius: 3rem;
    background: #fff;
  }

  .ems-login__field--user,
  .ems-login__field--pwd {
    width: 100%;
    margin-left: 0;
    border-radius: 3rem;

    ::v-deep .el-input__inner{
      border-radius: 0;
    }
  }

  .ems-login__field--pwd {
    margin-top: 0.75rem;
  }

  .ems-login__btn {
    width: 100% !important;
  }

  .ems-login__btn-item {
    width: 100%;

    ::v-deep .el-form-item__content {
      width: 100%;
    }
  }

  .ems-login__error {
    width: 100%;
  }

  .ems-login__btn-item{
    margin-top: 20px !important;
  }

}
</style>
