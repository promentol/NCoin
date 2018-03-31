import {
    Transaction
} from './Transaction'

import {
    Block
} from './Block'

import {
    hashTransaction,
    hashBlock
} from './Crypto'

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/bindNodeCallback';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';


export default class Persistence {

    static get Instance() {
        if(!this._instance) {
            this._instance = new Persistence()
        }
        return this._instance
    }

    private static _instance = null;

    private constructor() {

    }

    private _db: any;

    public set db (db) {
        this._db = db
    }
    
    public getBlockByHash: (string) => Observable<Block> = Observable.bindNodeCallback((
        blockHash: string,
        callback: (error: Error, buffer: Block) => void
    ) => this._db.get(`b-${blockHash}`, callback))

    public checkBlockByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
        blockHash: string,
        callback: (error: Error, value: boolean) => void
    ) => this._db.get(`b-${blockHash}`, (err, buffer) => callback(null, !err && !!buffer)))

    public getTransactionByHash: (string) => Observable<Transaction> = Observable.bindNodeCallback((
        transactionHash: string,
        callback: (error: Error, buffer: Transaction) => void
    ) => this._db.get(`t-${transactionHash}`, callback))

    public checkTransactionByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
        transactionHash: string,
        callback: (error: Error, value: boolean) => void
    ) => this._db.get(`t-${transactionHash}`, (err) => callback(null, !err)))

    public saveTransaction: (tx: Transaction) => Observable<boolean> = Observable.bindNodeCallback((
        tx: Transaction,
        callback: (error: Error, value: boolean) => void
    ) => this._db.put(`t-${hashTransaction(tx)}`, tx, (err, buffer) => callback(null, !err && !!buffer)))

    public saveBlock: (block: Block) => Observable<boolean> = Observable.bindNodeCallback((
        block: Block,
        callback: (error: Error, value: boolean) => void
    ) => this._db.put(`b-${hashBlock(block)}`, block, (err, buffer) => callback(null, !err && !!buffer)))

    public transactionPool: BehaviorSubject<Transaction[]> = new BehaviorSubject([]);

    public addTransactionToPool = (tx: Transaction) => {
        this.transactionPool.next([...this.transactionPool.getValue(), tx])
    };

    public eraseTransactionToPool = () => {
        this.transactionPool.next([])
    }
}