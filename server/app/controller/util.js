const BaseController = require('./base')
const fse = require('fs-extra')
const svgCaptcha = require('svg-captcha')
const path = require('path')
class UtilController extends BaseController {
    async captcha() {
        const { ctx } = this;
        const captcha = svgCaptcha.create({
            size: 4,
            fontSize: 50,
            width: 100,
            height: 40,
            noise:3
        })
        ctx.session.captcha = captcha.text
        ctx.response.type ='image/svg+xml'
        ctx.body = captcha.data
    }
    // async sendcode() {
    //     const { ctx } = this
    //     const email = ctx.query.email
    //     let code = Math.random().toString().slice(2,6)
    //     ctx.session.emailcode = code

    //     const subject = '芒果社区'
    //     const text = ''
    //     const html = `<span style="color:red">${code}</span>`

    //     const hasSend = await this.service.tools.sendMail(email, subject,text,html)

    //     if (hasSend) {
    //         this.success('发送成功')
    //     } else {
    //         this.error('发送失败')
    //     }
    // }
    async mergefile() {
        const { ext, name, hash, size } = this.ctx.request.body
        const filepath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
        await this.ctx.service.tools.mergefile(filepath, hash, size)
        this.success({
            url:`/public/${hash}.${ext}`
        })
    }
    async uploadfile() {
        const { ctx } = this
        const file = ctx.request.files[0]
        const { name, hash } = ctx.request.body


        const chunkPath = path.resolve(this.config.UPLOAD_DIR,hash)

        if (!fse.existsSync(chunkPath)) {
            await fse.mkdir(chunkPath)
        }


        await fse.move(file.filepath, `${chunkPath}/${name}`)
        this.message('切片上传成功')

        // await fse.move(file.filepath, this.config.UPLOAD_DIR + "/" + file.filename)

        // this.success({
        //     url:`/public/${file.filename}`
        // })
    }
}

module.exports = UtilController;