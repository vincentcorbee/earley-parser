export const source = /*ts*/ `
type UnionType<T extends foo<a.b, b>> = "one" | "two";

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

interface Foo extends Array<Array<Array<number>>> {
  body: string;
}

function foo (a: number, b: number): number {
  return a + b;
}

const bar = {
  type: 'foo'
};

const result = foo(1, 2);
`
