const express = require('express')
const bodyParser = require('body-parser')
import * as BlockChain from '../core'

export function initREST(port) {
    
    const app = express()

    app.use(bodyParser.json())

    app.get('/', function (req, res) {
        res.send('REST SERVER')
    })

    app.get('/blocksCount', function (req, res) {
        BlockChain.getBlockCount().subscribe((blocksCount)=>{
            res.send({
                blocksCount
            })
        })
    })

    app.get('/blocks/:hash', function (req, res) {
        BlockChain.getBlock(req.params.hash).subscribe((blocksCount) => {
            res.send({
                blocksCount
            })
        })
    })

    app.get('/transactions/:hash', function (req, res) {
        BlockChain.getTransaction(req.params.hash).subscribe((tx) => {
            res.send(tx)
        })
    })

    app.post('/transactions', function (req, res) {
    })

    app.use(function (req, res) {
        res.send('NOT FOUND')
    })
    
    app.listen(port, () => {
        console.log(`REST SERVER STARTED ${port}!`)
    })
}