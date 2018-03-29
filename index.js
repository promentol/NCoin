const crypto = require('crypto')
const axios = require('axios')
const { URL } = require('url');

class Blockchain {
    constructor() {
        this.chain = []
        this.current_transactions = []
        this.new_block({
            previous_hash: 1,
            proof: 100
        })

        this.nodes = new Set()
    }

    new_block({proof, previous_hash}) {
        const block = {
            'index': this.chain.length + 1,
            'timestamp': Date.now(),
            'transactions': this.current_transactions,
            'proof': proof,
            'previous_hash': previous_hash || Blockchain.hash(this.last_block),
        }

        this.current_transactions = []

        this.chain.push(block)
        return block
    }

    new_transaction(sender, recipient, amount) {
        this.current_transactions.push({
            sender, recipient, amount
        })

        return this.last_block['index'] + 1
    }

    static hash(block) {
        console.log(block)
        const json = JSON.stringify(block, Object.keys(block).sort())
        return crypto.createHash('sha256').update(json).digest().toString('hex')
    }

    get last_block() {
        console.log(this.chain)
        return this.chain[this.chain.length-1]
    }

    static proof_of_work(last_proof) {
        let proof = 0;
        while(!this.valid_proof(last_proof, proof)) {
           ++proof
        }
        return proof
    }

    static valid_proof(last_proof, proof, difficulties = 4) {
        const guess = `${last_proof}${proof}`
        const guess_hash = crypto.createHash('sha256').update(guess).digest().toString('hex')
        return guess_hash.substring(0, difficulties) == (function zeroString(d) {
            return d>1? zeroString(d-1)+"0": "0"
        })(difficulties)
    }

    valid_chain(chain) {
        const last_block = chain[0]
        const current_index = 1

        while (current_index < chain.length)  {
            const block = chain[current_index]
            if (block['previous_hash'] != Blockchain.hash(last_block)) {
                return false
            }

            if (Blockchain.valid_proof(last_block['proof'], block['proof'])) {
                return false
            }
            last_block = block
            current_index = current_index +1 
            
        }
        return true
    }

    register_node(address) {
        const myURL = new URL(address);
        this.nodes.add(myURL.host)
    }

    resolve_conflicts() {
        const neighbours = Array.from(this.nodes)

        const { chain } = neighbours
            .map((x) => axios.get(`http://${x}/node`))
            .filter((x) => x.status == 200)
            .map((x) => x.data)
            .reduce((previous, x) => {
                if( x.length > previous.length && this.valid_chain(x.chain) ) {
                    return x
                } else {
                    return previous
                }
            }, this.chain)

        if (chain != this.chain) {
            this.chain = chain
            return true
        }
        return false
    }

}


const express = require('express');
const app = express();
const uuidv1 = require('uuid/v1');
const node_identifier = uuidv1().replace('-', '')

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const blockchain = new Blockchain();
app.post('/transactions/new', function (req, res) {
    const index = blockchain.new_transaction(req.body.sender, req.body.recipienter, req.body.amount)
    res.send({
        message: index
    });
});

app.get('/mine', function (req, res) {
    const last_block = blockchain.last_block
    const last_proof = last_block['proof']
    const proof = Blockchain.proof_of_work(last_proof)

    blockchain.new_transaction(
        sender = "0",
        recipient = node_identifier,
        amount = 1,
    )

    const previous_hash = Blockchain.hash(last_block)
    const block = blockchain.new_block(proof, previous_hash)

    res.send({
        'message': "New Block Forged",
        'index': block['index'],
        'transactions': block['transactions'],
        'proof': block['proof'],
        'previous_hash': block['previous_hash'],
    })
})

app.get('/chain', function (req, res) {
    res.send({
        'chain': blockchain.chain,
        'length': blockchain.chain.length,
    })
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

console.log(Blockchain.proof_of_work("a"))

