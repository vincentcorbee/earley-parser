import { Lexer } from './modules/lexer'

const lexer = new Lexer()

const tokens = [
  {
    name: 'number',
    test: /^[0-9]+/,
  },
  {
    name: 'plus_minus',
    test: /^[+-]/,
  },
  {
    name: 'mul',
    test: '*',
  },
  {
    name: 'l_paren',
    test: '(',
  },
  {
    name: 'r_paren',
    test: ')',
  },
]

const source = '1+(2*3-4)'

lexer.setTokens(tokens)

lexer.source = source

// const regexp =
//   /(?<number>[0-9]+)|(?<plus_min>[+-])|(?<mul>\*)|(?<l_paren>\()|(?<r_paren>\))/g

// let match

// const tokensResultOne: any[] = []

// const tokenMap = new Map(Object.values(tokens).map(value => [value.name, value]))
// const s1 = performance.now()

// while ((match = regexp.exec(source))) {
//   const [value] = match

//   const groups = Object.entries(match.groups!)

//   let groupIndex = 0

//   const { length } = groups

//   while (groupIndex < length) {
//     if (groups[groupIndex][1] !== undefined) break

//     groupIndex++
//   }

//   const [name] = groups[groupIndex]

//   const token = tokenMap.get(name)

//   tokensResultOne.push({ ...token, value })
// }

// const e1 = performance.now()

// console.log(tokensResultOne)

// console.log(e1 - s1)

// let input = source.slice()

// let index = 0

// const tokensResult: any[] = []

// const s = performance.now()

// while (input) {
//   const result = input.match(regexp)

//   if (result) {
//     const [value, ...groups] = result

//     let groupIndex = 0

//     const { length } = groups

//     while (groupIndex < length) {
//       if (groups[groupIndex] !== undefined) break

//       groupIndex++
//     }

//     const token = tokens[groupIndex] as any

//     tokensResult.push({ ...token, value })

//     index += value.length

//     input = input.slice(value.length)
//   } else {
//     throw Error(`Syntax error at ${index}`)
//   }
// }

// const e = performance.now()

// console.log(tokensResult)

// console.log(e - s)

// let token

const gen = lexer.tokenGenerator()

const s2 = performance.now()

lexer.next()
lexer.next()
lexer.next()
lexer.next()
lexer.next()
lexer.next()
lexer.next()
lexer.next()
lexer.next()
// for (const token of lexer) {
//   // t += performance.now() - s
//   // console.log(token)
// }

const e2 = performance.now()

console.log(e2 - s2)
