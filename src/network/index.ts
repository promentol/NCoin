import * as net from 'net'
import * as ndjson from 'ndjson'
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable"
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/multicast';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/concatAll';
import 'rxjs/add/operator/concatMap';

import { checkServerIdentity } from 'tls';
import { Persistence, Crypto, Transaction, Block, Actions } from '../core';

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

        this.messages.subscribe((x)=>{
            //console.log(x.message)
        })

        //send getblock message
        Persistence.Instance.lastBlock.take(1).subscribe((block)=>{
            const x = new NCoinGetBlockMessage(Crypto.hashBlock(block))
            this.addresses.forEach((con: NCoinConnection) => {
                con.sendData(x.payloadBuffer)
            });
        })

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

        //Handle INV message
        this.messages
            .filter((x) => x.message instanceof NCoinInvMessage)
            .switchMap(({ connection, message }) => {
                if (message instanceof NCoinInvMessage) {
                    return Observable.from(message.data).mergeMap((inv: INV)=>{
                        if (inv.type == INV_TYPE.INV_TRANSACTION) {
                            return Persistence.Instance
                                .checkTransactionByHash(inv.hash)
                                .filter((x)=>!x)
                                .do((x) => {
                                    const getDataMessage = new NCoinGetDataMessage(inv)
                                    connection.sendData(getDataMessage.payloadBuffer)
                                })
                        } else {
                            return Persistence.Instance
                                .checkBlockByHash(inv.hash)
                                .filter((x) => !x)
                                .do((x) => {
                                    const getDataMessage = new NCoinGetDataMessage(inv)
                                    connection.sendData(getDataMessage.payloadBuffer)
                                })
                        }
                    })
                }
            }).subscribe(()=>{
                //console.log('process INV')
            })

        //handle getblock message
        this.messages
            .filter((x) => x.message instanceof NCoinGetBlockMessage)
            .switchMap(({ connection, message }) => {
                if (message instanceof NCoinGetBlockMessage) {
                    return Actions.getBlockUntill(message.data).map((blocks)=>{
                        return {
                            connection,
                            blocks: blocks.map((x) => <INV>{
                                type: INV_TYPE.INV_BLOCK,
                                hash: x
                            })
                        }
                    })
                }
                return Observable.of({
                    connection,
                    blocks: []
                })
            })
            .filter(({blocks})=>blocks.length > 0)
            .subscribe(({
                connection,
                blocks
            })=>{
                const mes = new NCoinInvMessage(blocks)
                connection.sendData(mes.payloadBuffer)
            })

        //handle getdata message
        this.messages
            .filter((x) => x.message instanceof NCoinGetDataMessage)
            .mergeMap(({connection, message}) => {
                if (message instanceof NCoinGetDataMessage) {
                    if(message.data.type == INV_TYPE.INV_BLOCK) {
                        return Persistence.Instance
                            .getBlockByHash(message.data.hash)
                            .do((x) => {
                                const blockMessage = new NCoinBlockMessage(x)
                                connection.sendData(blockMessage.payloadBuffer)
                            })
                            .map((x)=>!!x)
                            .catch(e=>Observable.of(false))
                    } else {
                        return Persistence.Instance
                            .getTransactionByHash(message.data.hash)
                            .do((x) => {
                                const txMessage = new NCoinTxMessage(x)
                                connection.sendData(txMessage.payloadBuffer)
                            })
                            .map((x) => !!x)
                            .catch(e => Observable.of(false))
                    }
                }
            })
            .subscribe(()=>{
                //console.log('get data message')
            })

        //handle tx message
        this.messages
            .filter((x) => x.message instanceof NCoinTxMessage)
            .subscribe(({ message }) => {
                if (message instanceof NCoinTxMessage) {
                    return Actions.acceptTransaction(message.data)
                }
            })

        //handle bx message
        this.messages
            .filter((x) => x.message instanceof NCoinBlockMessage)
            .concatMap(({message}) => {
                console.log('asd')
                if (message instanceof NCoinBlockMessage){
                    console.log('inside NCoinBlockMessage',message.data)

                    return Actions.acceptBlock(message.data)
                }
            })
            .subscribe(()=>{
                console.log('asd')
            })
        

        //Listen new transactions, send inv message
        Persistence.Instance.transactions.map((tx) => {
            return {
                type: INV_TYPE.INV_TRANSACTION,
                hash: Crypto.hashTransaction(tx)
            }
        }).map((x) => {
            return new NCoinInvMessage([x])
        }).subscribe((invMessage) => {
            this.addresses.forEach((con: NCoinConnection) => {
                //console.log(con)
                con.sendData(invMessage.payloadBuffer)
            });
        })

        //Listen new blocks, send inv message
        Persistence.Instance.blocks.map((block)=>{
            return {
                type: INV_TYPE.INV_BLOCK,
                hash: Crypto.hashBlock(block)
            }
        }).map((x)=>{
            return new NCoinInvMessage([x])
        }).subscribe((invMessage)=>{
            this.addresses.forEach((con: NCoinConnection) => {
                //console.log(con)
                con.sendData(invMessage.payloadBuffer)
            });
        })


        //setup ping and address table, remove
        Observable.interval(10*1000).subscribe((x)=>{
            const y = new NCoinPingMessage()
            this.addresses.forEach((con: NCoinConnection) => {
                con.sendData(y.payloadBuffer)
            });
        })

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
            (error) => console.log(error),
            () => { address && this.addresses.delete(address) }
        )
    }
}

abstract class NCoinConnection  {
    abstract sendData(m) 
    abstract get address()
    public messages: Subject<string> = new Subject();
}

class NCoinServerConnection extends NCoinConnection {
    constructor(socket){
        super()
        this.socket = socket

        this.socket
            .pipe(ndjson.parse())
            .on("data", (data)=>{
                this.messages.next(data)
            })
        this.socket.on("error", (e) => {
            console.log(e)
        })
        this.socket.on("close", (data)=>{
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

class NCoinClientConnection extends NCoinConnection {
    constructor(address: Address) {
        super()
        this.client = new net.Socket();
        this.client.connect(address.port, address.url)
        this.client
            .pipe(ndjson.parse())
            .on("data", (data)=>{
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

abstract class NCoinMessage {
    protected _type: string;
    public get type() {
        return this._type
    }
    static makeFromBuffer(dataBuf): NCoinMessage  {
        const { type, data } = dataBuf //JSON.parse(dataBuf.toString())
        
        if (type == NCoinAddressMessage.TYPE) {
            return new NCoinAddressMessage(data)
        }
        if (type == NCoinHelloMessage.TYPE) {
            return new NCoinHelloMessage(data)
        }
        if (type == NCoinInvMessage.TYPE) {
            return new NCoinInvMessage(data)
        }
        if (type == NCoinGetDataMessage.TYPE) {
            return new NCoinGetDataMessage(data)
        }
        if (type == NCoinGetBlockMessage.TYPE) {
            return new NCoinGetBlockMessage(data)
        }
        if (type == NCoinPingMessage.TYPE) {
            return new NCoinPingMessage()
        }
        if (type == NCoinTxMessage.TYPE) {
            return new NCoinTxMessage(data)
        }
        if (type == NCoinBlockMessage.TYPE) {
            return new NCoinBlockMessage(data)
        }
        return null
    }
    public get payloadBuffer() {
        return {
            type: this.type,
            data: this.payload
        }
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

class NCoinGetBlockMessage extends NCoinMessage {
    static TYPE = 'getblock';
    public data: INV;
    constructor(data) {
        super()
        this._type = NCoinGetBlockMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}

class NCoinBlockMessage extends NCoinMessage {
    static TYPE = 'block';
    public data: Block;
    constructor(data) {
        super()
        this._type = NCoinBlockMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}

class NCoinTxMessage extends NCoinMessage {
    static TYPE = 'tx';
    public data: Transaction;
    constructor(data) {
        super()
        this._type = NCoinTxMessage.TYPE
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

class NCoinPingMessage extends NCoinMessage {
    static TYPE = 'ping'
    constructor() {
        super()
        this._type = NCoinPingMessage.TYPE
    }
    get payload(): any {
        return "";
    }
}