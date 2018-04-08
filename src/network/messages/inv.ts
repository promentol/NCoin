import { NCoinMessage } from './message'
import { INV } from '../core'

export class NCoinInvMessage extends NCoinMessage {
    static TYPE = 'inv'
    public data: INV[];
    constructor(data) {
        super()
        this._type = NCoinInvMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }
}

export const NCoinInvMessageSchema = {
    "$id": "NCoinInvMessageSchema",
    //"$schema": "http://json-schema.org/schema#",
    "$patch": {
        "source": { "$ref": "NCoinMessageSchema" },
        "with": [
            { "op": "add", "path": "/properties/data", "value": { "$ref": "INVS" } }
        ]
    },
    "definitions": {
        "INVS": {
            "$id": "INVS",
            "type": "array",
            "items": {
                "$ref": "INV"
            }
        },
        "INV": {
            "$id": "INV",
            "type": "object",
            "properties": {
                "type": {
                    "type": "number",
                    "enum": [0, 1]
                },
                "hash": {
                    "type": "string",
                    "minLength": 32,
                    "maxLength": 32
                }
            }
        }
    }
}