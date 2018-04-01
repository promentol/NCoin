const net = require('net')


const client = new net.Socket()

client.connect(1996, '127.0.0.1')

client.on("data", (x)=>{
    console.log(JSON.parse(x.toString()))
})

client.write(Buffer.from(JSON.stringify({
    type: 'hello',
    data: {
        url: '127.0.0.1',
        port: 122
    }
})))