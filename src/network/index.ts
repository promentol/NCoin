import * as net from 'net'
import { Subject } from "rxjs/Subject";

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

export default class NCoinNetwork {
    constructor(myPort, bootAddresses: Address[]) {
        net.createServer(myPort, (socket)=>{
            this.processConnection(new NCoinServerConnection(socket))
        })
        bootAddresses.forEach((address: Address)=>{
            this.processConnection(new NCoinClientConnection(address))
        })

        //Handle Hello Message
        this.messages
            .subscribe(({ connection, message}) => {
                if (message instanceof NCoinHelloMessage) {
                    const addressMessage = new NCoinAddressMessage(this.addresses)
                    connection.sendData(addressMessage.payload)
                }
            })

        //Handle Address message
        this.messages
            .subscribe(({ connection, message }) => {
                if (message instanceof NCoinAddressMessage) {
                    message.addresses.forEach(address => {
                        this.processConnection(new NCoinClientConnection(address))
                    });
                }
            })

        //Handle getblock message
        //handle inv message
        //handle getdata message
        //handle tx message
        //handle bx message
        

        //Listen new transactions, send inv message
        //Listen new blocks, send inv message


        //setup ping and address table, remove

    }
    addresses: Address[];
    messages: Subject<{
        connection: NCoinConnection,
        message: NCoinMessage
    }> = new Subject();
    processConnection(n: NCoinConnection) {
        n.messages.map((message)=>{
            return {
                connection: n,
                message: NCoinMessage.makeFromBuffer(message)
            }
        }).subscribe(this.messages)
    }
}

abstract class NCoinConnection  {
    abstract sendData(m: Buffer) 
    messages: Subject<Buffer>;
}

class NCoinServerConnection extends NCoinConnection {
    constructor(socket){
        super()
        this.socket = socket
        this.socket.on("data", (data)=>{
            this.messages.next(data)
        })
        this.socket.on("close", (data)=>{
            this.messages.complete()
        })
    }
    socket: any;
    sendData(m: Buffer){
        this.socket.write(m)
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
        this.client.on("close", () => {
            this.messages.complete()
        })
    }
    client: any;
    sendData(m: Buffer) {
        this.client.write(m)
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
        return null
    }
    get payloadBuffer(): Buffer {
        return Buffer.from(JSON.stringify({
            type: this.type,
            data: this.payload
        }))
    }
    protected abstract get payload();
}

class NCoinHelloMessage extends NCoinMessage {
    static TYPE = 'hello'
    private data: any;
    constructor(data) {
        super()
        this._type = NCoinHelloMessage.TYPE
        this.data = [];
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