import { regExpLeftHandRightHandSeperator } from '../constants'

export const removeLeftHandSide = (expression: string, leftHandSide: string) =>
  expression
    .replace(leftHandSide, '')
    /* Remove the left hand right hand seperator */
    .replace(regExpLeftHandRightHandSeperator, '')
    .trim()
