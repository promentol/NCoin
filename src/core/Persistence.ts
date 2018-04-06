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
    Crypto
} from './Crypto'

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/bindNodeCallback';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

const genesis: Block = require('../config/genesis.json');

export class Persistence {

    static get Instance(): Persistence {
        if(this._instance == null) {
            this._instance = new Persistence()
        }
        return this._instance
    }

    private static _instance = null;

    private constructor() {
        this.dbSubject.subscribe((db)=>{
            console.log('new db')
            this.lastBlock.switchMap((b: Block) => {
                return this.getState(b);
            }).subscribe((s) => {
                this.currentState.next(s)
                console.log(s, `new state on block ${Crypto.hashBlock(this.lastBlock.getValue())}`)
            })

        })
    }

    private _db: any;
    private dbSubject: Subject<any> = new Subject()

    public setDB (db) {
        this._db = db;
        return this.prepareLastBlock().map((x)=>{
            this.dbSubject.next(db)
            return x;
        })
    }
    
    public getBlockByHash: (string) => Observable<Block> = Observable.bindNodeCallback((
        blockHash: string,
        callback: (error: Error, buffer: Block) => void
    ) => this._db.get(`b-${blockHash}`, helperCallback(callback)))

    public checkBlockByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
        blockHash: string,
        callback: (error: Error, value: boolean) => void
    ) => this._db.get(`b-${blockHash}`, (err, buffer) => callback(null, !err && !!buffer)))

    public getTransactionByHash: (string) => Observable<Transaction> = Observable.bindNodeCallback((
        transactionHash: string,
        callback: (error: Error, buffer: Transaction) => void
    ) => this._db.get(`t-${transactionHash}`, helperCallback(callback)))

    public checkTransactionByHash: (string) => Observable<boolean> = Observable.bindNodeCallback((
        transactionHash: string,
        callback: (error: Error, value: boolean) => void
    ) => this._db.get(`t-${transactionHash}`, (err) => callback(null, !err)))

    public saveTransaction: (tx: Transaction) => Observable<boolean> = Observable.bindNodeCallback((
        tx: Transaction,
        callback: (error: Error, value: boolean) => void
    ) => this._db.put(`t-${Crypto.hashTransaction(tx)}`, JSON.stringify(tx), (err, buffer) => callback(null, !err && !!buffer)))

    public writeBlock: (block: Block) => Observable<boolean> = Observable.bindNodeCallback((
        block: Block,
        callback: (error: Error, value: boolean) => void
    ) => this._db.put(`b-${Crypto.hashBlock(block)}`, JSON.stringify(block), (err, buffer) => callback(null, !err && !!buffer)))

    public transactionPool: BehaviorSubject<Transaction[]> = new BehaviorSubject([]);
    public transactions: Subject<Transaction> = new Subject()

    public addTransactionToPool = (tx: Transaction) => {
        this.transactionPool.next([...this.transactionPool.getValue(), tx])
        this.transactions.next(tx)
    };

    public eraseTransactionToPool = () => {
        this.transactionPool.next([])
    }

    public readonly currentState: BehaviorSubject<State> = new BehaviorSubject(initialState());

    public fetchState: (block: Block) => Observable<State> = Observable.bindNodeCallback((
        block: Block,
        callback: (error: Error, value: State) => void
    ) => this._db.get(`state-${Crypto.hashBlock(block)}`, (err, buffer) => callback(null, buffer && createState(JSON.parse(buffer.toString())))))
    
    public getState(block: Block):Observable<State> {
        if(BlockType.Genensis == block.header.type) {
            return Observable.of(initialState())
        } else {
            return this.fetchState(block).switchMap((state)=>{
                if (state) {
                    return Observable.of(state)
                }
                return this.getBlockByHash(block.header.previousBlockHash).switchMap((previousBlock: Block) => {
                    return this.getState(previousBlock)
                }).switchMap((previousState) => {
                    return applyBlockToState(previousState, block)
                }).switchMap((newState)=>{
                    return this.saveState(newState, block).map(()=>newState)
                })
            })
        }
    }

    public saveState: (sate: State, block: Block) => Observable<boolean> = Observable.bindNodeCallback((
        state: State,
        block: Block,
        callback: (error: Error, value: boolean) => void
    ) => this._db.put(`state-${Crypto.hashBlock(block)}`, JSON.stringify(serializeState(state)), (err, buffer) => callback(null, !err && !!buffer)))

    public readonly lastBlock: BehaviorSubject<Block> = new BehaviorSubject(genesis);
    public readonly blocks: Subject<Block> = new Subject();

    private prepareLastBlock(){
        return this.writeBlock(genesis).switchMap(()=>{
            return this.getLastBlock().map(x => {
                if (x) {
                    this.lastBlock.next(x)
                }
                return x;
            }).catch(e => {
                return this.saveLastBlock(genesis)
            })
        })
    }

    private getLastBlock: () => Observable<Block> = Observable.bindNodeCallback((
        callback: (error: Error, value: Block) => void
    ) => this._db.get(`lastBlock`, helperCallback(callback)))

    public saveLastBlock(lastBlock) {
        return this.writeLastBlock(lastBlock).switchMap(() => {
            return this.saveBlock(lastBlock)
        }).map((x)=>{
            this.lastBlock.next(lastBlock)
            return lastBlock
        });
    }

    public saveBlock(block) {
        return this.writeBlock(block).map(()=>{
            this.blocks.next(block)
            return block
        })
    }

    private writeLastBlock: (block: Block) => Observable<Block> = Observable.bindNodeCallback((
        block: Block,
        callback: (error: Error, value: Block) => void
    ) => this._db.put(`lastBlock`, JSON.stringify(block), (err, buffer) => {
        callback(null, buffer)
    }))
    
}

const helperCallback = (cb) => {
    return (err, buffer)=>{
        if(err) {
            cb(err)
        } else {
            cb(null, JSON.parse(buffer))
        }
    }
}