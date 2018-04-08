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
        return secp256k1.publicKeyCreate(privKey).toString('base64')
    }

    export function hash(data) {
        return crypto
            .createHash('sha256')
            .update(data)
            .digest()
    }

    export const hashBlock = (block: Block) => {
        return hash(encodeBlockHeader(block)).toString('base64');
    }

    export const hashTransaction = (tx: Transaction) => {
        return hash(encodeTransaction(tx)).toString('base64');
    }

    export const signBlock = (block: Block, privateKey): Block => {
        block.signature = secp256k1.sign(hash(encodeBlockHeader(block)), privateKey).signature.toString('base64')
        return block
    }

    export const verifySignatureOfBlock = (block: Block, publicKey) => {
        return secp256k1.verify(
            Buffer.from(hash(encodeBlockHeader(block)), 'base64'),
            Buffer.from(block.signature, 'base64'),
            publicKey);
    }

    export const verifyTransactionSignature = (tx: Transaction, publicKey) => {
        return secp256k1.verify(
            Buffer.from(hashTransaction(tx), 'base64'), 
            Buffer.from(tx.signature, 'base64'), 
            Buffer.from(publicKey, 'base64')
        );
    }

    export const signTransaction = (transaction: Transaction, privateKey): Transaction => {
        transaction.signature = secp256k1.sign(Buffer.from(hashTransaction(transaction), 'base64'), privateKey).signature.toString('base64');
        return transaction;
    }

    export const calculateMerkle = (transactions: Transaction[]) => {
        return fastRoot(transactions.map((x) => Buffer.from(encodeTransaction(x))), hash).toString('base64')
    }
}



