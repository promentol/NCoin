import * as net from 'net'
import { Subject } from "rxjs/Subject";
import * as ndjson from 'ndjson'

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

        this.socket
            .pipe(ndjson.parse())
            .on("data", (data) => {
                this.messages.next(data)
            })
        this.socket.on("error", (e) => {
            console.log(e)
        })
        this.socket.on("close", (data) => {
            this.messages.complete()
        })
        this.writeStream.pipe(this.socket)
    }
    socket: any;
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
        this.client
            .pipe(ndjson.parse())
            .on("data", (data) => {
                this.messages.next(data)
            })
        this.client.on("error", (e) => {
            console.log(e)
        })
        this.client.on("close", () => {
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