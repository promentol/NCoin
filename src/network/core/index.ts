import * as net from 'net'
import { Subject } from "rxjs/Subject";
import * as ndjson from 'ndjson'
var LDJSONStream = require('ld-jsonstream');

export interface Address {
    url: string;
    port: number;
}

export interface INV {
    type: INV_TYPE;
    hash: string;
}
export enum INV_TYPE {
    INV_TRANSACTION,
    INV_BLOCK
}

export abstract class NCoinConnection {
    abstract sendData(m)
    abstract get address()
    public messages: Subject<string> = new Subject();
}

export class NCoinServerConnection extends NCoinConnection {
    constructor(socket) {
        super()
        this.socket = socket

        const input = this.socket.pipe(this.ls)


        input.on("data", (data) => {
                this.messages.next(data)
            })
        input.on("error", (e) => {
            console.log(e)
            input.destroy()
            this.messages.complete()
        })
        input.on("close", (data) => {
            this.messages.complete()
        })

        this.writeStream.pipe(this.socket)
    }
    socket: any;
    ls = new LDJSONStream();
    writeStream = ndjson.serialize();
    sendData(m) {
        this.writeStream.write(m)
    }
    get address() {
        if (this.socket.remoteAddress.substr(0, 7) == "::ffff:") {
            return this.socket.remoteAddress.substr(7)
        }
        return this.socket.remoteAddress
    }
}

export class NCoinClientConnection extends NCoinConnection {
    constructor(address: Address) {
        super()
        this.client = new net.Socket();
        this.client.connect(address.port, address.url)
        const input = this.client.pipe(ndjson.parse())
        input.on("data", (data) => {
            this.messages.next(data)
        })
        input.on("error", (e) => {
            input.destroy()
            console.log(e)
            this.messages.complete()
        })
        input.on("close", () => {
            this.messages.complete()
        })
        this.writeStream.pipe(this.client)
    }
    client: any;
    writeStream = ndjson.serialize();
    sendData(m) {
        this.writeStream.write(m)
    }
    get address() {
        return ''
    }
}