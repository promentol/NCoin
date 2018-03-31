import {
    Transaction,
    TransactionType
} from './Transaction'

import {
    Block,
    BlockType
} from './Block'

import * as Crypto from './Crypto'

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


import Persistent from './Persistence'

const genesis: Block = require('../config/genesis.json');


export const verifyBlock = (block: Block) => {
    return Persistent.Instance.getBlockByHash(block.header.previousBlockHash).map((previousBlock) => {
        return previousBlock.header.depth + 1 == block.header.depth;
    }).map((x) => {
        return x && verifySignatureOfBlock(block)
    }).map((x) => {
        return x && verifyMerkleRootOfBlock(block)
    }).switchMap((x) => {
        if (x) {
            return verifyBlockTransactions(block)
        } else {
            return Observable.of(false)
        }
    })
}

export const verifySignatureOfBlock = (block: Block) => {
    if (!block.transactions || !block.transactions.length) {
        return false
    }
    if (block.transactions[0].data.type != TransactionType.CoinBase) {
        return false
    }
    if (genesis.authorities.indexOf(block.transactions[0].data.to) == -1) {
        return false;
    }

    const publicKey = Buffer.from(block.transactions[0].data.to, 'hex');
    return secp256k1.verify(hashBlock(block), block.singature, publicKey);
}

export const verifyBlockTransactions = (block: Block) => {
    //group by `from` calculate
    //call getSpendableAmount 
    if (!block.transactions || !block.transactions.length) {
        return Observable.of(false)
    }
    if (block.transactions[0].data.type != TransactionType.CoinBase) {
        return Observable.of(false);
    }
    if (block.transactions[0].data.amount != 100) {
        return Observable.of(false);
    }

    for (var i in block.transactions) {
        if (!verifyTransactionSignature(block.transactions[i])) {
            return Observable.of(false);
        }
    }
    block.transactions = [block.transactions[0]];
    return Observable.from(block.transactions).skip(1).mergeScan((result, tx) => {
        if (result) {
            return verifyTransactionAgainstBlock(tx, block).do((x) => block.transactions.push(tx))
        }
        return Observable.of(false);
    }, true)
}

export const verifyTransactionAgainstBlock = (tx: Transaction, block: Block) => {
    return getSpendableAmount(tx.data.from, block).map((data) => {
        return data.plus - data.minus >= tx.data.amount;
    })
}

//TODO
export const getSpendableAmount = (user: string, block: Block): any => {
    const minus = Observable
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