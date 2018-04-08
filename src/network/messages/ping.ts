import { NCoinMessage } from './message'

export class NCoinPingMessage extends NCoinMessage {
    static TYPE = 'ping'
    constructor() {
        super()
        this._type = NCoinPingMessage.TYPE
    }
    get payload(): any {
        return "";
    }
}