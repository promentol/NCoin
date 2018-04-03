import {
    Transaction,
    TransactionType
} from './Transaction'

import {
    Block,
    BlockType
} from './Block'

import * as Crypto from './Crypto'

import * as Immutable from 'immutable'

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


import Persistence from './Persistence'


interface State extends Immutable.Map<string, Balance> {

}

interface Balance {
    value: number;
    nonce: number;
}

const genesis: Block = require('../config/genesis.json');

export const initialState = (): State => {
    return Immutable.Map()
}

export const verifyBlock = (block: Block) => {
    return Persistence.Instance.getBlockByHash(block.header.previousBlockHash).map((previousBlock) => {
        return previousBlock.header.depth + 1 == block.header.depth;
    }).map((x) => {
        return x && verifySignatureOfBlock(block)
    }).map((x) => {
        return x && Crypto.calculateMerkle(block.transactions) == block.header.merkleRoot;
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
        if (!Crypto.verifyTransactionSignature(block.transactions[i], block.transactions[i].data.from)) {
            return Observable.of(false);
        }
    }
    return applyAndVerifyState(block)
}

export const applyAndVerifyState = (block: Block) => {
    return getState(block).map((state: State)=>{
        return true;
    }).catch((e) => {
        return Observable.of(false)
    })
}

export const getState = (block: Block): Observable<State> => {
    if(Crypto.hashBlock(block) == Crypto.hashBlock(genesis) ) {
        return Observable.of(initialState());
    } else {
        Persistence.Instance.getBlockByHash(block.header.previousBlockHash).switchMap((previousBlock: Block) =>{
            return getState(previousBlock)
        }).map((previousState)=>{
            return applyBlockToState(previousState, block)
        })
    }
}

export const applyBlockToState = (previousState: State, block: Block) => {
    return Observable.from(block.transactions).reduce(applyTransactionToState, previousState)
}

export const applyTransactionToState = (state: State, tx: Transaction) => {
    if (tx.data.from) {
        const accountA = state.get(tx.data.from)
        const accountB = state.get(tx.data.to)
        if (accountA.nonce > tx.data.nonce) {
            throw new Error("invalid nonce")
        }
        if (accountA.value < tx.data.amount) {
            throw new Error("invalid amount")
        }
        return state.set(tx.data.from, {
            nonce: tx.data.nonce,
            value: accountA.value - tx.data.amount
        }).set(tx.data.to, {
            nonce: tx.data.nonce,
            value: accountB.value + tx.data.amount
        })
    } else {
        const accountB = state.get(tx.data.to)
        return state.set(tx.data.to, {
            nonce: tx.data.nonce,
            value: accountB.value + tx.data.amount
        })
    }
}