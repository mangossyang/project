<template>
  <div>
    <h1>用户中心</h1>

    <div ref="drag"
         id="drag">
      <input type="file"
             @change="handleFile">
    </div>

    <el-progress :text-inside="true"
                 color="#f56c6c"
                 :percentage="uploadPercentage"
                 :stroke-width="20"></el-progress>
    <el-button @click="uploadFire">上传</el-button>
        <el-progress :text-inside="true"
                 color="#f56c6c"
                 :percentage="hashProgress"
                 :stroke-width="20"></el-progress>
    <div>
        <div class="cube-container" :style="{width:cubeWidth+'px'}">
            <div class="cube" v-for="chunk in chunks" :key="chunk.name">
                <div
                :class="{
                    'uploading':chunk.progress>0 && chunk.progress<100,
                    'success':chunk.progress==100,
                    'error':chunk.progress<0
                }"
                :style="{height:chunk.progress +'%'}">
                <i class="el-icon-loading" v-if="chunk.progress>0 && chunk.progress<100"></i>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import sparkMD5 from 'spark-md5';
const CHUNK_SIZE = 0.1 *1024 * 1024
export default {
  data() {
    return {
      file: null,
    //   uploadPercentage: 0,
      hashProgress:0,
      chunks:[],
      hash:null
    };
  },
  mounted() {
    this.$http.post("/user/info");
    this.bindEvents();
  },
  computed:{
      cubeWidth(){
          return Math.ceil(Math.sqrt(this.chunks.length)) * 16
      },
      uploadPercentage(){
          if (!this.files || this.chunks.length) {
              return 0
          }
          const loaded = this.chunks.map(item=>item.chunk.size*item.progress)
                            .reduce((acc,cur)=> acc+cur,0)
         return (loaded/this.files.size).toFixed(2)
      }
  },
  methods: {
    bindEvents() {
      let drag = this.$refs.drag;
      drag.addEventListener("dragover", (e) => {
        drag.style.borderColor = "skyblue";
        e.preventDefault();
      });
      drag.addEventListener("dragleave", (e) => {
        drag.style.borderColor = "#eee";
        e.preventDefault();
      });
      drag.addEventListener("drop", (e) => {
        const fileLists = e.dataTransfer.files;
        this.files = fileLists[0];
        drag.style.borderColor = "#eee";

      });
    },
    createFileChunk(file, size = CHUNK_SIZE) {
      const chunks = [];
      let cur = 0;
      while (cur < this.file.size) {
        chunks.push({
          index: cur,
          file: this.file.slice(cur, cur + size),
        });
        cur += size
      }
      return chunks
    },
    async calculateHashWorker(){
        return new Promise(resolve=>{
            this.worker = new Worker('/hash.js')
            this.worker.postMessage({chunks:this.chunks})
            this.worker.onmessage= e=>{
                const {progress,hash} = e.data
                this.hashProgress = Number(progress.toFixed(2))
                if (hash) {
                    resolve(hash)
                }
            }
        })
    },
    async calulateHashIdle(){
        return new Promise(resolve=>{
            const spark = new sparkMD5.ArrayBuffer()
            let count = 0
            const appendToSpark = async file=>{
                return new Promise(resolve=>{
                    const reader = new FileReader()
                    reader.readAsArrayBuffer(file)
                    reader.onload=e=>{
                        spark.append(e.target.result)
                        resolve()
                    }
                })
            }

            const workLoop = async deadline=>{
                while (count<this.chunks.length &&deadline.timeRemaining()>1) {
                    await appendToSpark(this.chunks[count].file)
                    count++
                    if (count<this.chunks.length) {
                        this.hashProgress= Number(((100*count)/this.chunks.length).toFixed(2))
                    }else{
                        this.hashProgress =100
                        resolve(spark.end())

                    }
                }
                window.requestIdleCallback(workLoop)
            }
            window.requestIdleCallback(workLoop)
        })
    },
    async calulateHashSample(){
        //布隆过滤器  判断一个数据存在与否
        return new Promise(resolve=>{
            const spark = new sparkMD5.ArrayBuffer()
            const reader = new FileReader()

            const file = this.file
            const size = file.size
            const offset = 2*1024*1024
            //第一个2M 最后一个数据全要
            let chunks = [file.slice(0,offset)]

            let  cur = offset
            while (cur<size) {
                if (cur+offset>= size) {
                    chunks.push(file.slice(cur, cur+offset))
                }else{
                    const mid = cur+offset/2
                    const end = cur+offset
                    chunks.push(file.slice(cur, cur+2))
                    chunks.push(file.slice(mid, mid+2))
                    chunks.push(file.slice(end-2, end))
                }
                cur +=offset
            }
            reader.readAsArrayBuffer(new Blob(chunks))
            reader.onload = e=>{
                spark.append(e.target.result)
                resolve(spark.end())
            }
        })
    },
    async uploadFire() {
      const chunks = this.createFileChunk(this.file);

    //   const hash = await this.calculateHashWorker()
    //   const hash1= await this.calulateHashIdle()
      this.hash= await this.calulateHashSample()
      this.chunks = chunks.map((chunk,index)=>{
          const name = this.hash + '-' + index
          return {
              hash:this.hash,
              name,
            index,
            chunk:chunk.file,
            progress:0
          }
      })
        await this.uploadChunks()
    },
    async uploadChunks(){
        const requests = this.chunks.map(chunk=>{
            const form = new FormData()
            form.append('chunk',chunk.chunk)
            form.append('name',chunk.name)
            form.append('hash',chunk.hash)
            return form
        }).map((form,index)=>{
            this.$http.post('/uploadfile',form,{

        onUploadProgress: (progress) => {
          this.chunks[index].progress = Number(
            ((progress.loaded / progress.total) * 100).toFixed(2)
          );
        },
            })
        })
        await Promise.all(requests)
        await this.mergeRequest()
    //   const form = new FormData();
    //   form.append("name", "file");
    //   form.append("file", this.file);
    //   await this.$http.post("/uploadfile", form, {
    //     onUploadProgress: (progress) => {
    //       console.log(progress);
    //       this.uploadPercentage = Number(
    //         ((progress.loaded / progress.total) * 100).toFixed(2)
    //       );
    //     },
    //   });
    },
    async mergeRequest(){
        this.$http.post('/mergefile',{
            ext: this.file.name.split('.').pop(),
            size: CHUNK_SIZE,
            hash:this.hash
        })
    },
    handleFile(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
    },
  },
};
</script>

<style lang='less' scoped>
#drag {
  height: 100px;
  border: 2px dashed #eee;
  line-height: 100px;
  text-align: center;
}
.cube-container{
    .cube{
        width: 14px;
        height: 14px;
        line-height: 12px;
        border: 1px solid black;
        background: #eee;
        float:left;
        .success{
            background:green;
        }
        .uploading{
            background:blue;

        }
        .error{
            background:red
        }
    }
}
</style>