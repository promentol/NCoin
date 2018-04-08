# NCoin
NCoin is demonstrational, Proof of Authority blockchain project, written in TypeScript.

## Build
Run ```npm install``` then ```tsc``` to build the project
## Launch
To launch the project, write
`node dist/index.js`
with following parameters:

| parameter  | description |
| ------------- | ------------- |
| `-d` or `--data`  | Folder for persisting data of Blockhain |
| `-m` or `--mining`  | Run mining module  |
| `-k` or `--key` | Path for private key file, needed only for mining  |
| `-p` or `--port`  | Port of running NCoin Network Node, default port is 1996 |
| `--nb`  | Option for running node without connecting to the existing node initially  |
| `-r` or `--rest`  | Port of running NCoin Rest API. If no argument is passed, rest api will not run  |

If you want to run mining module, you can type

```
node dist/index --nb -m -k ./keys/B
```

If you want to run regular node with rest api, you can type 

```
node dist/index -r 1200
```

## Technical Description
NCoin is demonstration blockchain project, it is written in TypeScript.

As a paradigm for development it was choosed to Functional Reactive Programming implemented by RxJS.

NCoin is using Ethereum's account based structure. It is storing in the current state (the balances of eahc address) inside memory. This is preventing double spending by applying each transaction in the block one by one.

In each transaction, nonce is used, which represents how many transactions previously was made by that address. Transactions in transactions pool or in the block are always sorted by nonce.

Block's header is hashed by SHA5 algorithm. Each block is containing hash of previous block as well.

For signing data, Ecliptic Curve cyrptograpphy was choosen. It is utilising famous Secp256k1 curve for signing and verifying data. Before Signing a block or Transaction, it is hased by SHA256 algorithm.

Addresses of accounts are base64 encoded public keys.

Blocks and Transactions are stored in JSON format. Bellow is described the format of Block and Transaction

## Block structure
| Key  | Description |
| ------------- | ------------- |
| header  | Header of Block |
| header.previousBlockHash | Hash of previous Block, string |
| header.depth | Depth of the block, number  |
| header.type  | 0 for Genesis, 1 for Regular Block |
| header.merkleRoot  | Merkle root of transactions, string  |
| header.payload | Additional payload which can be set by miner, string |
| signature | Signature of SHA256 hashed block's header using Secp256k1 private key, string |
| authorities | Represents public keys of miners, used only in Genesis Block, an array of strings |
| transactions | List of transactions included in the block. The first transaction should be coinbase |

## Transaction Structure
| Key  | Description |
| ------------- | ------------- |
| data  | Regular data of Transaction |
| data.from  | Address of sender, string |
| data.to  | Address of receiver, string |
| data.type  | 0 for coinbase, 1 for regular transaction |
| data.amount  | Amount of coins sent by `from`, number |
| data.payload  | Additional payload which can be set by `from`, string|
| data.nonce  | Nonce is generated in determined way, number|
| signature | Signature of SHA256 hashed transaction's data using Secp256k1 private key, string |

## Storage

For persisting the data of blockchain into storage, LevelDB was choosen. All data is stored as valid JSON string. Bellow is list of keys in LevelDB and their description.

| Key  | Description |
| ------------- | ------------- |
| b-{blockHash}  | Block with hash equal to `blockHash` |
| t-{txHash}  | Transaction with hash equal to `txHash` |
| state-{blockHash}  | State of balances on the time of block which hash is equal to `blockHash` |
| lastBlock  | last block |

## Communication between Nodes
As a protocol for transfering the data between nodes, TCP/IP was choosen.
Data sent by nodes is encoded by JSON, the line separated JSON structure is used to transport messages.

JSON Schema is used for validating incoming messages (under development). Once a message is received from a node which is not JSON encoded, the connection will be destroyed.

Bellow is table of available messages

| Type  | Description |
| ------------- | ------------- |
| hello | This is sent by a Node to another Node, to establish a contact |
| address | This is sent as a response to hello message with list of addresses which is known by it  |
| inv  | This is used to inform other nodes, that it have certain blocks or transaction |
| getblock | Node can send it with last hash of the block which it currently have |
| getdata | This is sent by node receive certain block or transaction |
| tx | this message is used to send transaction |
| block | this message is used to send block  |
| ping  | every minute a ping message is sent. If ping will fail, TCP connection will be closed |

Once node is up and running, it is sending `hello` message to list of known him addresses. Once response is received, it is sending `getdata`
message with last to it know block's hash to everyone, and as an answer it is receivng `inv` message with list of all next blocks. Then node can request specific block with `getdata` message, and receive block with `block` message.

## Rest API

| Type  | Description |
| ------------- | ------------- |
| GET /blocksCount | Get currently available block's count |
| GET /blocks/:hash | Fetch block by it's hash |
| GET /transactions/:hash  | Fetch transaction by it's hash |
| GET /:address/nonce | Get next nonce for specified address. This is used to compose transaction |
| POST /transactions | Create a new transaction. Transaction should be signed locally |

## TODO
This is good list of tasks for developers who wants to get more in blockchain development

- [ ] Change communication protocol from TCP/IP sockets, to HTTP
- [ ] Use Google Protobuffers for encoding data to transfer between nodes
- [ ] Add proof of working algorithm in miner module, use SHA5
- [ ] Use Priority Queue or Red Black Tree data structure instead of Sorted Array for transaction pool
- [ ] Create Helper command line tool, for generating private public keys pair, for signing transaction and so on
- [ ] Design a SPV node from scratch
- [ ] Create Electron APP as a wallet for NCoin
- [ ] Create Mobile APP as a wallet for NCoin
- [ ] Create an explorer web app for NCoin 
- [ ] Rebuild everything with Go or C++ !!!
