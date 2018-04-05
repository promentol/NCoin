const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const crypto = require('crypto')

const fastRoot = require('merkle-lib/fastRoot')

import {
    Transaction,
    encodeTransaction
} from './Transaction'

import {
    Block,
    encodeBlockHeader
} from './Block'

export namespace Crypto {

    export const generatePrivateKey = () => {
        const privKey = randomBytes(32)
        return verifyPrivateKey(privKey) ? privKey : generatePrivateKey()
    }

    export const verifyPrivateKey = (privKey) => {
        return secp256k1.privateKeyVerify(privKey)
    }

    export const generatePublicKey = (privKey) => {
        return secp256k1.publicKeyCreate(privKey)
    }

    export function hash(data) {
        return crypto
            .createHash('sha256')
            .update(data)
            .digest()
    }

    export const hashBlock = (block: Block) => {
        return hash(encodeBlockHeader(block)).toString('hex');
    }

    export const hashTransaction = (tx: Transaction) => {
        return hash(encodeTransaction(tx)).toString('hex');
    }

    export const signBlock = (block: Block, privateKey): Block => {
        block.singature = secp256k1.sign(hash(encodeBlockHeader(block)), privateKey)
        return block
    }

    export const verifySignatureOfBlock = (block: Block, publicKey) => {
        return secp256k1.verify(hash(encodeBlockHeader(block)), block.singature, publicKey);
    }

    export const verifyTransactionSignature = (tx: Transaction, publicKey) => {
        return secp256k1.verify(hashTransaction(tx), Buffer.from(tx.signature), publicKey)
    }

    export const signTransaction = (transaction: Transaction, privateKey): Transaction => {
        transaction.signature = secp256k1.sign(hashTransaction(transaction), privateKey)
        return transaction;
    }

    export const calculateMerkle = (transactions: Transaction[]) => {
        return fastRoot(transactions.map((x) => Buffer.from(encodeTransaction(x))), hash).toString('hex')
    }
}



