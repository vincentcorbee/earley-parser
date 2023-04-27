import { regExpBrackets, regExpSeperatorParameters } from '../constants'

export const getParametersSymbol = (parameters?: string) =>
  parameters
    ? parameters.replace(regExpBrackets, '').trim().split(regExpSeperatorParameters)
    : []
