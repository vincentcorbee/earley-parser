class State {
  constructor(rule, dot, start, end) {
    this.rule = rule
    this.dot = dot
    this.start = start
    this.end = end
  }
}

function parse(grammar, input) {
  const chart = [[]]

  // Initialize the chart with the start state
  const startState = new State(
    grammar.rules.find(rule => rule.lhs === grammar.start),
    0,
    0,
    0
  )
  chart[0].push(startState)

  for (let i = 0; i <= input.length; i++) {
    chart.push([])

    for (const state of chart[i]) {
      if (state.dot < state.rule.rhs.length) {
        // Predict
        const nextSymbol = state.rule.rhs[state.dot]
        if (nextSymbol === state.rule.lhs) {
          // Right-recursive rule
          const newState = new State(state.rule, state.dot + 1, state.start, state.end)
          chart[i].push(newState)
        } else {
          for (const rule of grammar.rules) {
            if (rule.lhs === nextSymbol) {
              const newState = new State(rule, 0, i, i)
              chart[i].push(newState)
            }
          }
        }
      } else {
        // Complete
        for (const prevState of chart[state.start]) {
          if (
            prevState.dot < prevState.rule.rhs.length &&
            prevState.rule.rhs[prevState.dot] === state.rule.lhs
          ) {
            const newState = new State(
              prevState.rule,
              prevState.dot + 1,
              prevState.start,
              i
            )
            chart[i].push(newState)
          }
        }
      }

      if (i < input.length) {
        // Scan
        if (state.dot < state.rule.rhs.length && state.rule.rhs[state.dot] === input[i]) {
          const newState = new State(
            state.rule,
            state.dot + 1,
            state.start,
            state.end + 1
          )
          chart[i + 1].push(newState)
        }
      }
    }
  }

  return (
    chart[input.length]?.some(
      state =>
        state.start === 0 &&
        state.end === input.length &&
        state.rule.lhs === grammar.start
    ) ?? false
  )
}

// Example usage
const grammar = {
  start: 'Sum',
  rules: [
    { lhs: 'Sum', rhs: ['Sum', '[+-]', 'Product'] },
    { lhs: 'Sum', rhs: ['Product'] },
    { lhs: 'Product', rhs: ['Product', '"*"', 'Factor'] },
    { lhs: 'Product', rhs: ['Factor'] },
    { lhs: 'Factor', rhs: ['"("', 'Sum', '")"'] },
    { lhs: 'Factor', rhs: ['Number'] },
    { lhs: 'Number', rhs: ['[0-9]+'] },
  ],
}

const input = ['1', '+', '2', '*', '3']
const isParsed = parse(grammar, input)
console.log('Is parsed:', isParsed)
