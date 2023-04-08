export default class Token {
  constructor(
    public name: string,
    public value: any,
    public line: number,
    public col: number,
    public index: number
  ) {}
}
