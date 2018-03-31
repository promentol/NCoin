//--miner private-key
//--data-dir

const net = require('net');

const levelup = require('levelup')
const leveldown = require('leveldown')

const db = levelup(leveldown('./data/db'))

const fastRoot = require('merkle-lib/fastRoot')

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge'; 
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/groupBy';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/mergeScan'; 


import { BehaviorSubject } from 'rxjs/BehaviorSubject';

const config = Observable.of(require('./config/config.json'))
const nodes = config.map((_) => _.nodes)

export interface Transaction {
    data: {
        from?: string;
        type: TransactionType;
        to: string;
        amount: number;
        payload: string;
    },
    signature?: string;
}

enum TransactionType {
    CoinBase = 0,
    Transfer = 1,
}

export interface CoinbaseTransaction extends Transaction {
}

export interface UserTransaction extends Transaction{
    from: string;
}

const signTransaction = (tx) => {
    return tx;
}

enum BlockType {
    Genensis = 0,
    Usual = 1,
}

export interface Block {
    header: BlockHeader;
    singature: string;
    authorities?: string[];
    transactions: Transaction[];
}

export interface BlockHeader {
    previousBlockHash: string;
    depth: number;
    type: BlockType;
    merkleRoot: string;
    payload: string;
}

/*
export const getTransactionByHash: (string) => Observable<Transaction> = Observable.bindNodeCallback((
    transactionHash: string,
    callback: (error: Error, buffer: Transaction) => void
) => db.get(`t-${transactionHash}`, callback))

export const checkTransactionByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
    transactionHash: string,
    callback: (error: Error, value: boolean) => void
) => db.get(`t-${transactionHash}`, (err) => callback(null, !err)))
*/

const transactionPool: Transaction[] = [];
const addToPool = (transactionPool: Transaction[], tx: Transaction) => {
    transactionPool.push(tx)
};

const erasePool = (transactionPool: Transaction[]) => {
    transactionPool = []
};

export const getBlockByHash: (string) => Observable<Block> = Observable.bindNodeCallback((
    blockHash: string,
    callback: (error: Error, buffer: Block) => void
) => db.get(`b-${blockHash}`, callback))

export const checkBlockByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
    blockHash: string,
    callback: (error: Error, value: boolean) => void
) => db.get(`b-${blockHash}`, (err, buffer) => callback(null, !err && !!buffer)))

export const processBlock = (block: Block) => {
    return verifyBlock(block).switchMap((x) => {
        if(x){
            return db.put(`b-${hashBlock(block)}`, block)
        } else {
            throw new Error("invalid block")
        }
    })
}

const crypto = require('crypto')

export function hash(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest()
        .toString('hex')
}

export const hashBlock = (block: Block) => {
    return hash(encodeBlockHeader(block));
}

export const encodeBlockHeader = (block: Block) => {
    return JSON.stringify(block.header, Object.keys(block.header).sort())
}

export const encodeTransaction = (tx: Transaction) => {
    return JSON.stringify(tx.data, Object.keys(tx.data).sort())
}

export const decodeBlockHeader = (asd: string) => {
    return JSON.parse(asd)
}

export const calculateMerkle = (transactions: Transaction[]) => {
    return fastRoot(transactions.map((x) => Buffer.from(encodeTransaction(x))), hash).toString('hex')
}

export const verifyBlock = (block: Block) => {
    return getBlockByHash(block.header.previousBlockHash).map((previousBlock) => {
        return previousBlock.header.depth + 1 == block.header.depth;
    }).map((x) => {
        return x && verifySignatureOfBlock(block)
    }).map((x) => {
        return x && verifyMerkleRootOfBlock(block)
    }).switchMap((x) => {
        if(x){
            return verifyTransactions(block)
        } else {
            return Observable.of(false)
        }
    })
}

export const verifyMerkleRootOfBlock = (block: Block) => {
    return calculateMerkle(block.transactions) == block.header.merkleRoot;
}
const genesis: Block = require('./config/genesis.json');

export const verifySignatureOfBlock = (block: Block) => {
    if (!block.transactions || !block.transactions.length) {
        return false
    }
    if (block.transactions[0].data.type != TransactionType.CoinBase) {
        return false
    }
    if(genesis.authorities.indexOf(block.transactions[0].data.to) == -1) {
        return false;
    }
    
    //TODO SIGNATURE
    //test signature
    return true;
}

export const verifyTransactions = (block: Block) => {
    //group by `from` calculate
    //call getSpendableAmount 
    if (!block.transactions || !block.transactions.length) {
        return Observable.of(false)
    }
    if (block.transactions[0].data.type != TransactionType.CoinBase) {
        return Observable.of(false);
    }
    block.transactions = [block.transactions[0]];
    return Observable.from(block.transactions).skip(1).mergeScan((result, tx)=>{
        return result && verifyTransactionAgainstBlock(tx, block).do((x)=>block.transactions.push(tx))
    }, true)
}


export const verifyTransactionAgainstBlock = (tx: Transaction, block: Block) => {
    return getSpendableAmount(tx.data.from, block).map((data)=>{
        return data.plus - data.minus >= tx.data.amount;
    })
}

//TODO
export const getSpendableAmount = (user: string, block: Block): any => {
    const minus =  Observable
        .from(block.transactions)
        .filter((tx: Transaction) => tx.data.from == user)
        .toArray()
        .scan((acc, curr) => acc + curr, );

    const plus = Observable
        .from(block.transactions)


    return Observable.merge(minus, plus).switchMap(([minus, plus]) => {
        const result = { minus, plus }
        if (block.header.type == BlockType.Genensis) {
            return Observable.of({
                plus,
                minus
            })
        } else {
            return getBlockByHash(block.header.previousBlockHash).switchMap((prevBlock) => {
                return getSpendableAmount(user, prevBlock)
            }).switchMap((data: any) => {
                return {
                    plus: data.plus + plus,
                    minus: data.minus + minus
                }
            })
        }
    })
    
}


//TODO to LEVEL DB KEY
export const lastBlockHash = 1;

//
//addresses
//Incoming getBlock
//Send getBlock 
//Incoming inv //transaction
//Send INV
//Send block
//Get new Block
//Get new transaction
//ping
//pong

//mining module

//debug(checkTransactionByHash('a'))

function debug(x) {
     x.subscribe((a)=>console.log(a))
}
