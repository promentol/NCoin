import * as net from 'net'
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable"
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/multicast';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import { checkServerIdentity } from 'tls';
import { Persistence, Crypto } from '../core';

declare class Map<T> extends NodeIterator {
    set(key, value)
    delete(key)
    forEach(cb)
    has(key)
}


//hello question
//address  answer
//getblocks question
//inv answer
//Incoming getBlock
//Send getBlock 
//Incoming inv //transaction
//Send INV
//Send block
//get data (tx, block) by hash
//Get new Block
//Get new transaction
//ping

/*
NCoinNetwork  subject observe all messages


NCoinConnection Absrract Class //sendMessage, onMessage
NCoinServerConnection
NCoinClientConnection

NCoinMessage Class abstract
Hello
Address
INV  emit message
GetBlock hash (response by ping)
Ping
GetData (transaction, block)
Tx
Block
*/


//WeakMap
const AddressBook = {
    //'ip' to socket
}

interface Address {
    url: string;
    port: number;
}

interface INV {
    type: INV_TYPE;
    hash: string;
}
enum INV_TYPE {
    INV_TRANSACTION,
    INV_BLOCK
}

export default class NCoinNetwork {
    mainConnection: NCoinServerConnection;
    constructor(private myPort, bootAddresses: Address[]) {
        const server = net.createServer((socket)=>{
            console.log(' !=!=!=!=!=!  new conection !=!=!=!=!=!')
            const con = new NCoinServerConnection(socket)
            this.processConnection(con)
        })
        server.listen(myPort, ()=>{
            console.log(`TCP SERVER STARTED ON PORT ${myPort}`)
        })
        server.on('error', (e: any) => {
            
        });
        
        bootAddresses.forEach((address: Address)=>{
            this.processAddress(address)
        })

        //send getblock message

        //Handle Hello Message
        this.messages
            .subscribe(({ connection, message }) => {
                if (message instanceof NCoinHelloMessage) {
                    const addressMessage = new NCoinAddressMessage(this.getAddresses())
                    connection.sendData(addressMessage.payloadBuffer)
                    this.addresses.set(`${connection.address}:${message.data.port}`, connection)
                }
            })

        //Handle Address message
        this.messages
            .subscribe(({ connection, message }) => {
                if (message instanceof NCoinAddressMessage) {
                    message.addresses.forEach(address => {
                        this.processAddress(address)
                    });
                }
            })

        //TODO
        //Handle INV message
        this.messages
            .subscribe(({ connection, message }) => {
                console.log(message)
                if (message instanceof NCoinInvMessage) {
                    message.data.forEach((inv: INV)=>{
                        console.log('inv', inv)
                    })
                }
            })

        //handle getblock message
        //handle getdata message
        //handle tx message
        //handle bx message
        

        //Listen new transactions, send inv message
        //Listen new blocks, send inv message
        Persistence.Instance.blocks.map((block)=>{
            return {
                type: INV_TYPE.INV_BLOCK,
                hash: Crypto.hashBlock(block)
            }
        }).map((x)=>{
            return new NCoinInvMessage([x])
        }).subscribe((invMessage)=>{
            console.log('========================', invMessage)
            console.log(this.addresses)
            this.addresses.forEach((con: NCoinConnection) => {
                console.log(con)
                con.sendData(invMessage.payloadBuffer)
            });
        })


        //setup ping and address table, remove

    }
    getAddresses() {
        const addresses = []
        this.addresses.forEach((x, y) => addresses.push(y))
        return addresses
    }
    addresses: Map<Address> = new Map();
    messages: Subject<{
        connection: NCoinConnection,
        message: NCoinMessage
    }> = new Subject();

    processAddress(address: Address) {
        if(!this.addresses.has(address)){
            const n = new NCoinClientConnection(address)
            const hello = new NCoinHelloMessage({
                port: this.myPort
            })
            n.sendData(hello.payloadBuffer)
            this.addresses.set(address, n)// = n
            this.processConnection(n)
        }
    }

    processConnection(n: NCoinConnection, address?: Address) {
        n.messages.map((message)=>{
            return {
                connection: n,
                message: NCoinMessage.makeFromBuffer(message)
            }
        }).subscribe(
            (x)=>{ this.messages.next(x) },
            (error) => console.log("Error"),
            () => { address && this.addresses.delete(address) }
        )
    }
}

abstract class NCoinConnection  {
    abstract sendData(m: Buffer) 
    abstract get address()
    public messages: Subject<Buffer> = new Subject();
}

class NCoinServerConnection extends NCoinConnection {
    constructor(socket){
        super()
        this.socket = socket
        this.socket.on("data", (data)=>{
            this.messages.next(data)
        })
        this.socket.on("error", (e) => {
            console.log(e)
        })
        this.socket.on("close", (data)=>{
            this.messages.complete()
        })
    }
    socket: any;
    sendData(m: Buffer){
        this.socket.write(m)
    }
    get address() {
        if (this.socket.remoteAddress.substr(0, 7) == "::ffff:") {
            return this.socket.remoteAddress.substr(7)
        }
        return this.socket.remoteAddress
    }
}

class NCoinClientConnection extends NCoinConnection {
    constructor(address: Address) {
        super()
        this.client = new net.Socket();
        this.client.connect(address.port, address.url)
        this.client.on("data", (data)=>{
            this.messages.next(data)
        })
        this.client.on("error", (e) => {
            console.log(e)
        })
        this.client.on("close", () => {
            this.messages.complete()
        })
    }
    client: any;
    sendData(m: Buffer) {
        this.client.write(m)
    }
    get address() {
        return ''
    }
}

abstract class NCoinMessage {
    protected _type: string;
    public get type() {
        return this._type
    }
    static makeFromBuffer(dataBuf: Buffer): NCoinMessage  {
        const { type, data } = JSON.parse(dataBuf.toString())
        
        if (type == NCoinAddressMessage.TYPE) {
            return new NCoinAddressMessage(data)
        }
        if (type == NCoinHelloMessage.TYPE) {
            return new NCoinHelloMessage(data)
        }
        if (type == NCoinInvMessage.TYPE) {
            return new NCoinInvMessage(data)
        }
        return null
    }
    public get payloadBuffer(): Buffer {
        return Buffer.from(JSON.stringify({
            type: this.type,
            data: this.payload
        }))
    }
    protected abstract get payload();
}

class NCoinHelloMessage extends NCoinMessage {
    static TYPE = 'hello'
    public data: any;
    constructor(data) {
        super()
        this._type = NCoinHelloMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }
}

class NCoinInvMessage extends NCoinMessage {
    static TYPE = 'inv'
    public data: INV[];
    constructor(data) {
        super()
        this._type = NCoinInvMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }
}

class NCoinGetDataMessage extends NCoinMessage {
    static TYPE = 'getdata';
    public data: INV;
    constructor(data) {
        super()
        this._type = NCoinGetDataMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}

class NCoinAddressMessage extends NCoinMessage {
    static TYPE = 'address'
    private data: Address[];
    constructor(addr: Address[] | Buffer) {
        super()
        this._type = NCoinAddressMessage.TYPE
        if(addr instanceof Buffer) {
            this.data = JSON.parse(addr.toString()).data
        } else {
            this.data = addr
        }
    }
    get payload(): any {
        return this.data;
    }
    get addresses() {
        return this.data
    }
}