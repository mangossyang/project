const BaseController = require('./base')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const HashSalt = 'yang'
const createRule = {
    email: {
        type: 'email'
    },
    nickname: {
        type: 'string'
    },
    pwd: {
        type: 'string'
    },
    captcha: {
        type: 'string'
    },

}


class UserController extends BaseController {
    async login() {
        const { ctx } = this
        const { email, pwd, captcha } = ctx.request.body

        if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
            return this.error('验证吗错误')
        }

        const user = await ctx.model.User.findOne({
            email,
            pwd:md5(pwd+HashSalt)
        })
        if (!user) {
            return this.error('用户名密码错误')
        }
        const token = jwt.sign({
            _id: user._id,
            email
        }, this.app.config.jwt.secret, {
            expiresIn:'1h'
        })

        this.success({ token, email,nickname:user.nickname})

    }

    async register() {
        const {
            ctx
        } = this
        try {
            ctx.validate(createRule)
        } catch (e) {
            return this.error('参数校验失败', -1, e.errors)
        }
        const {
            email,
            pwd,
            captcha,
            nickname
        } = ctx.request.body
        if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
            return this.error('验证吗错误')
        }

        if (await this.checkEamil(email)) {
            this.error('邮箱重复了')
        } else {
            const ret = await ctx.model.User.create({
                email,
                nickname,
                pwd: md5(pwd + HashSalt)
            })

            if (ret._id) {
                this.message('注册成功')
            }
        }


    }

    async checkEamil(email) {
        const user = await this.ctx.model.User.findOne({
            email
        })
        return user
    }
    async verify() {

    }

    async info() {
        const { ctx } = this
        const user = await this.checkEamil(ctx.state.email)
        this.success(user)
    }
}

module.exports = UserController;