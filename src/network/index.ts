import * as net from 'net'
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable"
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/multicast';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/concatAll';
import 'rxjs/add/operator/concatMap';

import {
    NCoinMessageFactory,
    NCoinAddressMessage,
    NCoinBlockMessage,
    NCoinGetBlockMessage,
    NCoinGetDataMessage,
    NCoinHelloMessage,
    NCoinInvMessage,
    NCoinMessage, 
    NCoinPingMessage,
    NCoinTxMessage
} from './messages'

import { 
    NCoinClientConnection,
    NCoinConnection,
    NCoinServerConnection,
    Address,
    INV,
    INV_TYPE
} from "./core";

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
            .concatMap(({ message }) => {
                if (message instanceof NCoinTxMessage) {
                    return Actions.acceptTransaction(message.data)
                }
            }).subscribe(()=>{
                console.log('Transaction ')
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
            console.log('Persistence.Instance.transactions', x)
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
                message: NCoinMessageFactory.fromJSON(message)
            }
        }).subscribe(
            (x)=>{ this.messages.next(x) },
            (error) => console.log(error),
            () => { address && this.addresses.delete(address) }
        )
    }
}