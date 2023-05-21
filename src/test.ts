export const arraySlice = () => {
  let a = new Array(9999999).fill(99)
  let s = performance.now()
  let b = a.slice()

  let t = performance.now() - s

  console.log({ arraySlice: t })
}

const testCreateClass = () => {
  class O {
    a: boolean
    b: boolean

    constructor(a: boolean, b: boolean) {
      this.a = a
      this.b = b
    }

    c() {}

    d() {}
  }

  const start = performance.now()

  for (let i = 0; i < 300; i++) {
    new O(true, true)
  }

  const end = performance.now()

  console.log('class', end - start)
}

const testCreateFunction = () => {
  interface OInterface {
    a: boolean
    b: boolean
  }

  function c() {}
  function d() {}

  function O(this: OInterface, a: boolean, b: boolean) {
    this.a = a
    this.b = b
  }

  O.prototype = {
    c() {},

    d() {},
    constructor: O,
  }

  const start = performance.now()

  for (let i = 0; i < 300; i++) {
    // @ts-ignore
    new O(true, true)
  }

  const end = performance.now()

  console.log('function', end - start)
}

const testCreateObject = () => {
  function c() {}
  function d() {}

  function createObject(a: boolean, b: boolean) {
    return {
      a,
      b,
    }
  }

  const start = performance.now()

  for (let i = 0; i < 300; i++) {
    ;({
      a: true,
      b: true,
      // c,
      // d,
    })

    // createObject(true, true)
  }

  const end = performance.now()

  console.log('object', end - start)
}

const testCreateArray = () => {
  function c() {}
  function d() {}

  function createArray(a: boolean, b: boolean) {
    return [a, b]
  }

  const start = performance.now()

  for (let i = 0; i < 300; i++) {
    ;[true, true]

    // createArray(true, true)
  }

  const end = performance.now()

  console.log('array', end - start)
}

const testCallFunctionWithObject = () => {
  function f(input: { a: boolean; b: boolean }) {}

  const start = performance.now()

  for (let i = 0; i < 300; i++) {
    f({
      a: true,
      b: true,
    })
  }

  const end = performance.now()

  console.log('function with object', end - start)
}

const testCallFunctionWithParams = () => {
  function f(a: boolean, b: boolean) {}

  const start = performance.now()

  for (let i = 0; i < 300; i++) {
    f(true, true)
  }

  const end = performance.now()

  console.log('function with object', end - start)
}

// testCreateClass()

// testCreateObject()

// testCreateArray()

// testCreateFunction()

testCallFunctionWithObject()

// testCallFunctionWithParams()
