const express = require('express')
const bodyParser = require('body-parser')

export function initREST(port) {
    
    const app = express()

    app.use(bodyParser.json())

    app.get('/', function (req, res) {
        res.send('REST SERVER')
    })

    app.get('/blocksCount', function (req, res) {

        res.send('REST SERVER')
    })

    app.get('/blocks/:hash', function (req, res) {
        res.send('REST SERVER')
    })

    app.get('/transactions/:hash', function (req, res) {
        res.send('REST SERVER')
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