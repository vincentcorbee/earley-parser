export const source = `
// interface ESTreeNode {
//   type: string
//   loc: SourceLocation | null
//   start: number
//   end: number
// }

type ProgramBody = Array<Statement | ImportOrExportDeclaration>

type SourceType = 'script' | 'module'

// interface Program extends ESTreeNode {
//   type: 'Program'
//   sourceType: SourceType
//   body: ProgramBody
// }

// function foo (a: number, b: number): number {
//   return a + b;
// }

// const result = foo(1, 2);

// interface Foo extends Array<Array<Array<number>>> {

// }
`
