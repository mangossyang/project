const { Service } = require('egg')
const path = require('path')
const fse = require('fs-extra')

class ToolService extends Service{
    async mergefile(filePath,fileHash,size) {
        const chunkDir = path.resolve(this.config.UPLOAD_DIR, fileHash)
        let chunks = await fse.readdir(chunkDir)
        chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
        chunks = chunks.map(cp => path.resolve(chunkDir, cp))
        await this.mergeChunks(chunks,filePath,size)
    }
    async mergeChunks(files, dest, size) {
        const pipStream = (filePath, writeStream) => new Promise(res => {
            const readStream = fse.createReadStream(filePath)
            readStream.on('end', () => {
                fse.unlinkSync(filePath)
                res()
            })
            readStream.pipe(writeStream)
        })

        await Promise.all(
            files.map((file, index) => {
                pipStream(file, fse.createWriteStream(dest, {
                    start: 0,
                    end:(index+1)*size
                }))
            })
        )
    }
}

module.exports = ToolService;