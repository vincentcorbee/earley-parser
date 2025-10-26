import { ChartColumns, Productions, StateInput, StateInterface, StateSetInterface, Token } from '../../types';
export declare class Chart {
    productions: Productions;
    columns: ChartColumns;
    private seed;
    constructor(productions: Productions);
    get lastColumn(): StateSetInterface;
    empty(): void;
    setSeed(seed: StateSetInterface | null): void;
    add(stateLike: StateInput | StateInterface): StateInterface | null;
    advanceState(state: StateInterface, parentState: StateInterface): StateInterface | null;
    scanState(state: StateInterface, token?: Token | null): StateInterface | null;
    addStateSet(stateSet: StateSetInterface): StateSetInterface;
    forEach(callbackFn: (value: StateSetInterface, key: number) => void): void;
    reduce(callbackFn: (accumlator: any, value: StateSetInterface, key: number) => any, startValue?: any): any;
    [Symbol.iterator](): ArrayIterator<StateSetInterface>;
}
