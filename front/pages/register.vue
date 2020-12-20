<template>
  <div class="login-container">
    <el-form ref="regiesterForm"
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
      <el-form-item prop="nickname"
                    label="昵称">
        <el-input v-model="form.nickname"
                  placeholder="请输入昵称"></el-input>
      </el-form-item>
      <el-form-item prop="pwd"
                    label="密码">
        <el-input v-model="form.pwd"
                  type="password"
                  placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-form-item prop="reppwd"
                    label="确认密码">
        <el-input v-model="form.reppwd"
                  type="password"
                  placeholder="请再次输入密码"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary"
                   @click.native.prevent="handleRegister">注册</el-button>
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
      form: {
        email: "1484824012@qq.com",
        nickname: "yang",
        pwd: "123456",
        reppwd: "123456",
        cpatcha: "",
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱" },
          { type: "email", message: "请输入正确的邮箱格式" },
        ],
        captcha: [{ required: true, message: "请输入验证码" }],
        nickname: [{ required: true, message: "请输入昵称" }],
        pwd: [
          {
            required: true,
            pattern: /^[\w_-]{6,12}$/g,
            message: "请输入6~12位密码",
          },
        ],
        reppwd: [
          { required: true, message: "请再次输入密码" },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.pwd) {
                callback(new Error("两次密码不一致"));
              } else {
                callback();
              }
            },
          },
        ],
      },
      code: {
        captcha: "/api/captcha",
      },
    };
  },
  methods: {
    resetCpatcha() {
      this.code.captcha = "/api/captcha?_t" + new Date().getTime();
    },
    handleRegister() {
      this.$refs.regiesterForm.validate(async (valid) => {
        if (valid) {
          let obj = {
            email: this.form.email,
            nickname: this.form.nickname,
            pwd: md5(this.form.pwd),
            captcha: this.form.captcha,
          };
          let ret = await this.$http.post("/user/register", obj);
          if (ret.code == 0) {
            this.$alert("注册成功", "成功", {
              confirmButtonText: "去登录",
              callback: () => {
                this.$router.push("/login");
              },
            });
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