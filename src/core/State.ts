import {
    Transaction,
    TransactionType
} from './Transaction'

import {
    Block,
    BlockType
} from './Block'

import { Crypto } from './Crypto'

import * as Immutable from 'immutable'

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';

const genesis: Block = require('../config/genesis.json');

export class State {
    private a: Immutable.Map<string, string>;
    constructor(x) {
        if(x instanceof Immutable.Map) {
            this.a = x;
        }
    }
    serializeBalance(x: Balance) {
        return JSON.stringify(x);
    }
    deserializeBalance(x: string):Balance {
        return x && <Balance>JSON.parse(x);
    }
    toJS(){
        return this.a.toJS();
    }
    get(x) {
        return this.deserializeBalance(this.a.get(x))
    }
    set(x, y:Balance) {
        return new State(this.a.set(x, this.serializeBalance(y)))
    }

} 

export interface Balance {
    value: number;
    nonce: number;
}


export const initialState = (): State => {
    return new State(Immutable.Map())
}

export const createState = (x: {}): State => {
    return new State(Immutable.fromJS(x))
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
        const accountA = state.get(tx.data.from) || defaultBalance()
        const accountB = state.get(tx.data.to) || defaultBalance()
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
        const accountB = state.get(tx.data.to) || defaultBalance()
        return state.set(tx.data.to, {
            nonce: tx.data.nonce,
            value: accountB.value + tx.data.amount
        })
    }
}

const defaultBalance = () => {
    return {
        nonce: 0,
        value: 0
    }
}