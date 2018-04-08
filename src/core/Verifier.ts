import {
    Transaction,
    TransactionType
} from './Transaction'

import {
    Block,
    BlockType
} from './Block'

import {
    getState,
    State,
    initialState,
    applyTransactionToState
} from './State'

import { Crypto } from './Crypto'

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
import 'rxjs/add/operator/reduce';
import 'rxjs/add/operator/catch'; 


import {Persistence} from './Persistence'

const genesis: Block = require('../../config/genesis.json');

export const verifyBlock = (block: Block) => {
    return Persistence.Instance.getBlockByHash(block.header.previousBlockHash).map((previousBlock) => {
        return previousBlock.header.depth + 1 == block.header.depth;
    }).map((x) => {
        return x && verifySignatureOfBlock(block)
    }).map((x) => {
        return x && Crypto.calculateMerkle(block.transactions) == block.header.merkleRoot;
    }).switchMap((x) => {
        if (x) {
            return verifyBlockTransactions(block).take(1)
        } else {
            return Observable.of(false)
        }
    })
}

export const verifyTransaction = (tx: Transaction) => {
    if(tx.data.type != TransactionType.Transfer) {
        return Observable.of(false);
    }
    
    if(
        Crypto.verifyTransactionSignature(
            tx,
            tx.data.from
        )
    ) {
        return Observable.of(false);
    }

    return Persistence.Instance.currentState.map((state) => {
        return applyTransactionToState(state, tx)
    }).map(() => {
        return true;
    }).catch(() => {
        return Observable.of(false)
    })
}

export const verifySignatureOfBlock = (block: Block) => {
    if (!block.transactions || !block.transactions.length) {
        return false
    }
    if (block.transactions[0].data.type != TransactionType.CoinBase) {
        return false
    }
    /*
    if (genesis.header.authorities.indexOf(block.transactions[0].data.to) == -1) {
        return false;
    }
    */

    const publicKey = Buffer.from(block.transactions[0].data.to, 'base64');
    return Crypto.verifySignatureOfBlock(block, publicKey)
}

export const verifyBlockTransactions = (block: Block) => {
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
        if (i != '0' && !Crypto.verifyTransactionSignature(block.transactions[i], block.transactions[i].data.from)) {
            return Observable.of(false);
        }
    }
    return applyAndVerifyState(block)
}

export const applyAndVerifyState = (block: Block) => {
    return Persistence.Instance.getState(block).map((state: State)=>{
        return true;
    }).catch((e) => {
        return Observable.of(false)
    })
}
//
