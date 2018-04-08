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