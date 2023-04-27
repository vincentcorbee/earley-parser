export const getRawExpression = (leftHandSide: string, rightHandSides: string[][]) =>
  rightHandSides.reduce(
    (acc, part, i) => acc + `${part.join(' ')}${rightHandSides[i + 1] ? ' | ' : ''}`,
    `${leftHandSide} : `
  )
