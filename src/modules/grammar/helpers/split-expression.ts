export const splitExpression = (expression: string, separator = ' ') => {
  const parts = []

  let start = 0

  let previousChar = ''

  let isInString = false

  let isInClass = false

  let canSplit = true

  for (let index = 0, end = expression.length - 1; index <= end; index++) {
    const currentChar = expression[index]

    if (currentChar === '"') isInString = isInString ? false : true

    if (currentChar === '[') isInClass = true

    if (currentChar === ']') isInClass = false

    canSplit = !isInString && !isInClass

    if (currentChar === separator && canSplit) {
      parts.push(expression.substring(start, index))

      start = index + 1
    }

    if (index === end) parts.push(expression.substring(start, index + 1).trim())

    previousChar = currentChar
  }

  return parts
}
