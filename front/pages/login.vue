<template>
  <div class="login-container">
    <el-form ref="loginrForm"
             class="login-form"
             label-width="100px"
             :model="form"
             :rules="rules">
      <div class="title-container">
        <img src=""
             alt="">
      </div>
      <el-form-item prop="email"
                    label="邮箱">
        <el-input v-model="form.email"
                  placeholder="请输入邮箱"></el-input>
      </el-form-item>

      <div class="capthcha-container">
        <el-form-item prop="captcha"
                      class="item"
                      label="验证码">
          <el-input v-model="form.captcha"
                    placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <div class="captcha"
             @click="resetCpatcha">
          <img :src="code.captcha"
               alt="">
        </div>
      </div>
      <!-- <div class="capthcha-container">
        <el-form-item prop="emailcode"
                      class="item">
          <el-input v-model="form.captcha"
                    placeholder="请输入邮箱验证码"></el-input>
        </el-form-item>
        <div class="captcha">
          <el-button type="primary"
                     :disabled="timer!=0"
                     @click="sendEmailCode">{{sendText}}</el-button>
        </div>
      </div> -->

      <el-form-item prop="pwd"
                    label="密码">
        <el-input v-model="form.pwd"
                  type="password"
                  placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary"
                   @click.native.prevent="lohandleLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from "md5";
export default {
  layout: "login",
  data() {
    return {
      timer: 0,
      form: {
        email: "1484824012@qq.com",
        pwd: "123456",
        cpatcha: "",
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱" },
          { type: "email", message: "请输入正确的邮箱格式" },
        ],
        captcha: [{ required: true, message: "请输入验证码" }],
        pwd: [
          {
            required: true,
            pattern: /^[\w_-]{6,12}$/g,
            message: "请输入6~12位密码",
          },
        ],
      },
      code: {
        captcha: "/api/captcha",
      },
    };
  },
  computed: {
    sendText() {
      if (!this.timer) {
        return "发送";
      } else {
        return this.timer + "s后再发送";
      }
    },
  },
  methods: {
   async  sendEmailCode() {
       await this.$http.get('/sendcode?email='+this.form.email)
      this.timer = 10;
      let t = setInterval(() => {
        this.timer -= 1;
        if (!this.timer) {
          clearInterval(t);
        }
      }, 1000);
    },
    resetCpatcha() {
      this.code.captcha = "/api/captcha?_t" + new Date().getTime();
    },
    lohandleLogin() {
      this.$refs.loginrForm.validate(async (valid) => {
        if (valid) {
          let obj = {
            email: this.form.email,
            pwd: md5(this.form.pwd),
            captcha: this.form.captcha,
          };
          let ret = await this.$http.post("/user/login", obj);
          if (ret.code == 0) {
            this.$message.success("登录成功");
            localStorage.setItem('token',ret.data.token)
            setTimeout(() => {
              this.$router.push("/uc");
            }, 500);
          } else {
            this.$message.error(ret.message);
          }
        }
      });
    },
  },
};
</script>

<style lang='less' scoped>
</style>