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

const genesis: Block = require('../config/genesis.json');

export interface State extends Immutable.Map<string, Balance> {
    
}

export interface Balance {
    value: number;
    nonce: number;
}


export const initialState = (): State => {
    return Immutable.Map()
}

export const createState = (x: {}): State => {
    return Immutable.fromJS(x)
}

export const serializeState = (state: State) => {
    return state.toJS()
}

export const getState = (block: Block, getPreviousBlock: (block: Block) => Observable<Block>): Observable<State> => {
    if (block.header.type == BlockType.Genensis) {
        return Observable.of(initialState());
    } else {
        return getPreviousBlock(block).switchMap((previousBlock: Block) => {
            return getState(previousBlock, getPreviousBlock)
        }).switchMap((previousState) => {
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