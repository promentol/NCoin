///<reference path="../../node_modules/@types/node/index.d.ts" />

import events = require('events');

import {
    Actions,
    Crypto,
    Persistence,
    Transaction,
    TransactionType
} from '../core'

import * as Rx from 'rxjs'
import { applyTransactionToState } from '../core/State';

export class Miner extends events.EventEmitter {
    timeout: any;

    constructor(public privateKey: Buffer, public payload: string) {
        super();
    }

    public startMining() {
        console.log('miner have started')

        Rx
            .Observable
            .interval(5000)
            .do((x)=>console.log(x+'   ============================='))
            .switchMap(() => Persistence.Instance.transactionPool.take(1))
            .merge(Persistence.Instance.transactionPool
                .filter((transactions) => {
                    return transactions.length > 10
                })
            )
            .switchMap(this.simplifyTransactions)
            .switchMap((transactions)=>{
                return Actions.createBlock(transactions, this.payload, this.privateKey)
            })
            //.do((x) => console.log(x))
            .switchMap(Actions.processBlock)
            .subscribe((block)=>{
                console.log(`new block created`) //${Crypto.hashBlock(block)}`)
            })
    }

    private simplifyTransactions(transactions: Transaction[]) {
        console.log('simplifyTransactions')
        return Persistence.Instance.currentState.switchMap((state)=>{
            return Rx.Observable.from(transactions).reduce((acc, tx) => {
                if(acc.newTransactions.length > 10) {
                    return acc
                }
                try {
                    return {
                        state: applyTransactionToState(acc.state, tx),
                        newTransactions: [...acc.newTransactions, tx]
                    }
                } catch(e) {
                    return acc
                }
            }, {
                newTransactions: <Transaction[]>[],
                state
            })
        }).map(x => {
            return x.newTransactions
        })
    }
    
}