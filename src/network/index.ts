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

const config = require('../config/config')

class NCoinNetwork {
    constructor(myPort, bootAddresses: string[]) {
        net.createServer(myPort, (socket)=>{
            this.processConnection(new NCoinServerConnection(socket))
        })
        bootAddresses.forEach((address)=>{
            this.processConnection(new NCoinClientConnection('33', address))
        })
    }
    messages: Subject<{
        connection: NCoinConnection,
        message: NCoinMessage
    }>;
    processConnection(n: NCoinConnection) {
        n.messages.map((message)=>{
            return {
                connection: n,
                message: NCoinMessage.make(message)
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
    constructor(port, address) {
        super()
        this.client = new net.Socket();
        this.client.connect(port, address)
        this.client.on("data", (data)=>{
            this.messages.next(NCoinMessage.make(data))
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
    from: string;
    type: string;
    static make(data) {
        return null
    }
    abstract payload(): Buffer;
}