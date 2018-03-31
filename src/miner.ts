///<reference path="../node_modules/@types/node/index.d.ts" />
import events = require('events');

import {
    transactionPool,
    signBlock,
    calculateMerkle,
    eraseTransactionToPool,
    createBlock
} from './core'

export class Miner extends events.EventEmitter {
    timeout: any;
    privateKey: Buffer;

    constructor(privateKey) {
        super();
        this.privateKey = privateKey;
    }

    private startMining() {
        createBlock().subscribe(() => eraseTransactionToPool())
    }
}