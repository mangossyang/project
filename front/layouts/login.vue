<template>
  <div>
    <!-- <div>
        导航
    </div> -->
    <nuxt></nuxt>
  </div>
</template>

<script>
export default {};
</script>

<style lang='less' >
.login-container {
  width: 100%;
  min-height: 100%;
  .login-form {
    width: 520px;
    padding: 160px 0;
    margin: 0 auto;
    overflow: hidden;
  }
  .capthcha-container {
    display: flex;
    justify-content: space-between;
    .item{
        width: 400px;
    }
    .captcha {
      .el-button{
          width: 90px;
          padding: 0;
          line-height: 40px;
      }
      img {
        width: 90px;
        cursor: pointer;
      }
    }
  }
}
</style>