///<reference path="../node_modules/@types/node/index.d.ts" />

import { Crypto, Persistence } from './core'
import {
    initREST
} from './rest'

import { Miner } from './miner'
import NCoinNetwork from './network'

//PROCESS ARGUMENTS
const parseArgs = require('minimist')
const args = parseArgs(process.argv)
const fs = require('fs')


//data directory
const dataDirectory = args.d || args.data || './data'

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
//private key, public key initiation
const keyDirectory = args.k || args.key
const key = keyDirectory ? fs.readFileSync(keyDirectory) : Crypto.generatePrivateKey()

if (!Crypto.verifyPrivateKey(key)) {
    console.error(`Not valid private key`);
    process.exit()
}


//network port
const netWorkPort = parseInt(args.p) || parseInt(args.port) || 1996
const noBootstrap = args.nb

const { bootAddresses } = require('./config/config')

//rest port
const restPort = parseInt(args.r) || parseInt(args.rest)


//miner 
const minerModule = (args.m) || (args.mining) || (args.mine)

var levelup = require('levelup')
var leveldown = require('leveldown')

// 1) Create our store
var db = levelup(leveldown(dataDirectory))

// 2) set backend for persistence
Persistence.Instance.setDB(db).subscribe(()=>{

    //initialize network
    new NCoinNetwork(netWorkPort, noBootstrap ? [] : bootAddresses)

    //initialize REST API
    if (restPort) {
        initREST(restPort)
    }

    //mining module
    if (minerModule) {
        const miner = new Miner(key, 'payload')
        miner.startMining();
    }
})
