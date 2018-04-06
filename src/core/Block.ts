import { Transaction } from './Transaction'


export enum BlockType {
    Genensis = 0,
    Usual = 1,
}

export interface Block {
    header: BlockHeader;
    signature: string;
    authorities?: string[];
    transactions: Transaction[];
}

export interface BlockHeader {
    previousBlockHash: string;
    depth: number;
    type: BlockType;
    merkleRoot: string;
    payload: string;
}

export const encodeBlockHeader = (block: Block) => {
    return JSON.stringify(block.header, Object.keys(block.header).sort())
}

export const decodeBlockHeader = (asd: string) => {
    return JSON.parse(asd)
}