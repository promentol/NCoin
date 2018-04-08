export abstract class NCoinMessage {
    protected _type: string;
    public get type() {
        return this._type
    }
    public get payloadBuffer() {
        return {
            type: this.type,
            data: this.payload
        }
    }
    protected abstract get payload();
}

export const NCoinMessageSchema = {
    "$id": "NCoinMessageSchema.json#",
    "$schema": "http://json-schema.org/schema#",
    "title": "Message",
    "type": "object",
    "required": ["type", "data"],
    "properties": {
        "type": {
            "type": "string"
        },
        "data": {
            "type": "object"
        }
    }
}