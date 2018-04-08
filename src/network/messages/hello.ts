import { NCoinMessage } from './message'

export class NCoinHelloMessage extends NCoinMessage {
    static TYPE = 'hello'
    public data: any;
    constructor(data) {
        super()
        this._type = NCoinHelloMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }
}
