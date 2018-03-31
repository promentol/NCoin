///<reference path="../node_modules/@types/node/index.d.ts" />

import * as BlockChain from './core'
import {
    initREST
} from './rest'

//PROCESS ARGUMENTS
const parseArgs = require('minimist')
const args = parseArgs(process.argv)
const fs = require('fs')


//data directory
const dataDirectory = args.d || args.data || '../data'

try {
    const stats = fs.lstatSync(dataDirectory)

    if (!stats.isDirectory()) {
        console.error(`${dataDirectory} is not a directory`);
        process.exit()
    }
} catch(e) {
    if (e.code == 'ENOENT') {
        console.error(`${dataDirectory} is not a directory`);
    } else {
        console.error(e)
    }
    process.exit()
}

//private key
//private key, public key initioation
const keyDirectory = args.k || args.key
const key = keyDirectory ? fs.readFileSync(keyDirectory) : BlockChain.generatePrivateKey()

if (!BlockChain.verifyPrivateKey(key)) {
    console.error(`Not valid private key`);
    process.exit()
}


//network port
//initialize network
//initialize Network

//rest port
//initialize REST API
const restPort = parseInt(args.r) || parseInt(args.rest)
if (restPort) {
    initREST(restPort)
}

//miner
//initialize Miner Network

