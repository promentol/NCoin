///<reference path="../../node_modules/@types/node/index.d.ts" />

import events = require('events');

import {
    Actions,
    Crypto,
    Persistence,
    Transaction,
    TransactionType,
    Block
} from '../core'

import * as Rx from 'rxjs'
import { applyTransactionToState } from '../core/State';

const genesis: Block = require('../../config/genesis.json');


export class Miner {

    constructor(public privateKey: Buffer, public payload: string) {
        const publicKey = Crypto.generatePublicKey(privateKey).toString('base64')
        if (genesis.authorities.indexOf(publicKey) == -1) {
            console.log('INVALID PRIVATE KEY FOR MINING')
            process.exit()
        }
    }

    public startMining() {
        console.log('MINER HAVE BEEN STARTED')

        Rx
            .Observable
            .interval(10*1000)//*10)
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
            .switchMap(Actions.processBlock)
            .subscribe((block: Block)=>{
                console.log(`new block created ${Crypto.hashBlock(block)}`)
            })
    }

    private simplifyTransactions(transactions: Transaction[]) {
        return Persistence.Instance.currentState.take(1).switchMap((state)=>{
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