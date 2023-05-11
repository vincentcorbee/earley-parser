export const source = `
type UnionType = "one" | "two";

type Number = number;

type NumberArray = Array<number>;

interface Node {
  type: string;
}

interface ESTreeNode {
  type: string;
  loc: SourceLocation | null;
  start: number;
  end: number;
}

type ProgramBody = Array<Statement | ImportOrExportDeclaration>;

type SourceType = 'script' | 'module';

interface Program extends ESTreeNode {
  type: 'Program';
  sourceType: 'script' | 'module';
  body: ProgramArray<Statement | ImportOrExportDeclaration>;
}

function foo (a: number, b: number): number {
  return a + b;
}

const result = foo(1, 2);

interface Foo extends Array<Array<Array<number>>> {
  body: string;
}
`
