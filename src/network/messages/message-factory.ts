import { NCoinAddressMessage } from './address'
import { NCoinHelloMessage } from './hello'
import { NCoinMessage } from './message'
import { NCoinInvMessage } from './inv'
import { NCoinGetDataMessage } from './get-data'
import { NCoinGetBlockMessage } from './get-block'
import { NCoinPingMessage } from './ping'
import { NCoinTxMessage } from './tx'
import { NCoinBlockMessage } from './block'

var Ajv = require('ajv');
var ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
require('ajv-merge-patch/keywords/patch')(ajv);


export class NCoinMessageFactory{
    static fromJSON(json): NCoinMessage {
        const {data, type}  = json

        if (type == NCoinAddressMessage.TYPE) {
            return new NCoinAddressMessage(data)
        }
        if (type == NCoinHelloMessage.TYPE) {
            return new NCoinHelloMessage(data)
        }
        if (type == NCoinInvMessage.TYPE) {
            return new NCoinInvMessage(data)
        }
        if (type == NCoinGetDataMessage.TYPE) {
            return new NCoinGetDataMessage(data)
        }
        if (type == NCoinGetBlockMessage.TYPE) {
            return new NCoinGetBlockMessage(data)
        }
        if (type == NCoinPingMessage.TYPE) {
            return new NCoinPingMessage()
        }
        if (type == NCoinTxMessage.TYPE) {
            return new NCoinTxMessage(data)
        }
        if (type == NCoinBlockMessage.TYPE) {
            return new NCoinBlockMessage(data)
        }
        return null
    }
}