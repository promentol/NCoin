import {
    Transaction
} from './Transaction'

import {
    Block, BlockType
} from './Block'

import {
    State, initialState, createState, serializeState, applyBlockToState
} from './State'

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

const genesis: Block = require('../config/genesis.json');

export default class Persistence {

    static get Instance(): Persistence {
        if(!this._instance) {
            this._instance = new Persistence()
        }
        return this._instance
    }

    private static _instance = null;

    private constructor() {
        this.lastBlock
    }

    private _db: any;

    public setDB (db) {
        this._db = db
        return this.prepareLastBlock().map((lastBlock)=>{
            return this.prepareState(lastBlock)
        })
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

    public currentState: State = initialState();

    public fetchState: (block: Block) => Observable<State> = Observable.bindNodeCallback((
        block: Block,
        callback: (error: Error, value: State) => void
    ) => this._db.get(`state-${hashBlock(block)}`, (err, buffer) => callback(null, createState(buffer))))
    
    public saveState: (sate: State, block: Block) => Observable<boolean> = Observable.bindNodeCallback((
        state: State,
        block: Block,
        callback: (error: Error, value: boolean) => void
    ) => this._db.put(`state-${hashBlock(block)}`, serializeState(state), (err, buffer) => callback(null, !err && !!buffer)))

    private _lastBlock: Block;
    public get lastBlock() {
        return this._lastBlock
    }

    private prepareLastBlock(){
        return this.getLastBlock().map(x=>{
            this._lastBlock = x;
            return x;
        }).catch(e => {
            return this.saveBlock(genesis)
        })
    }

    private getLastBlock: () => Observable<Block> = Observable.bindNodeCallback((
        callback: (error: Error, value: Block) => void
    ) => this._db.get(`lastBlock`, (err, buffer) => callback(null, buffer)))

    public saveLastBlock(lastBlock) {
        this._lastBlock = lastBlock
        return this.writeLastBlock(lastBlock);
    }

    public prepareState: (b: Block) => {
        //return Observable.of()
    }

    private writeLastBlock: (block: Block) => Observable<Block> = Observable.bindNodeCallback((
        block: Block,
        callback: (error: Error, value: Block) => void
    ) => this._db.put(`lastBlock`, block, (err, buffer) => callback(null, buffer)))
    
}