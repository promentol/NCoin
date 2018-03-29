//--miner private-key
//--data-dir

const net = require('net');

const levelup = require('levelup')
const leveldown = require('leveldown')

const db = levelup(leveldown('./data/db'))

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/operator/map';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const config = Observable.of(require('./config/config.json'))
const nodes = config.map((_) => _.nodes)

export abstract class Transaction {
    from?: string;
    type: string;
    to: string;
    amount: string;
    signature?: string;
    hash() {
        return 'asd'
    }
}

export class CoinbaseTransaction extends Transaction {
    authorities: string[]
}

export class UserTransaction extends Transaction{
    from: string;
}

const signTransaction = (tx) => {
    return tx;
}

export class Block {
    header: BlockHeader;    
    transactions: Transaction[];
    hash() {
        return this.header.hash()
    }
}

export class BlockHeader {
    previousBlockHash: string;
    depth: number;
    nonce: number;
    merkleRoot: string;
    hash() {
        return 'asd'
    }
}

export const getTransactionByHash: (string) => Observable<Transaction> = Observable.bindNodeCallback((
    transactionHash: string,
    callback: (error: Error, buffer: Transaction) => void
) => db.get(`t-${transactionHash}`, callback))

export const checkTransactionByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
    transactionHash: string,
    callback: (error: Error, value: boolean) => void
) => db.get(`t-${transactionHash}`, (err) => callback(null, !err)))

export const getBlockByHash: (string) => Observable<Block> = Observable.bindNodeCallback((
    blockHash: string,
    callback: (error: Error, buffer: Block) => void
) => db.get(`b-${blockHash}`, callback))

export const checkBlockByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
    blockHash: string,
    callback: (error: Error, value: boolean) => void
) => db.get(`b-${blockHash}`, (err, buffer) => callback(null, !err && !!buffer)))

export const verifyBlock = (block: Block) => {
    //verify depth
    //verify nonce
    //verifySignatureOfBlock
    //verifyMerkleRootOfBlock
    //verifySpendableAmount
    //
    return true;
}

export const verifyMerkleRootOfBlock = (block: Block) => {
    //verify merkle root
}

export const verifySignatureOfBlock = (block: Block) => {
    //verify signature
}

export const verifyTransactions = (block: Block) => {
    //group by `from` calculate
    //call getSpendableAmount 
}

export const getSpendableAmount = (user: string, block: Block) => {

}


debug(checkTransactionByHash('a'))

function debug(x) {
     x.subscribe((a)=>console.log(a))
}




