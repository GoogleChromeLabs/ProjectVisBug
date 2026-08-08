import test from 'ava'
import { getBoxQuad, quadBounds, quadPath, sideMidpoint } from './quad'

const quad = {
  p1: {x: 10, y: 20},
  p2: {x: 50, y: 10},
  p3: {x: 60, y: 40},
  p4: {x: 20, y: 50},
}

test('calculates the axis-aligned bounds of a transformed quad', t => {
  t.deepEqual(quadBounds(quad), {
    left: 10,
    right: 60,
    top: 10,
    bottom: 50,
    width: 50,
    height: 40,
  })
})

test('creates a local SVG path for a transformed quad', t => {
  t.is(quadPath(quad, {x: 10, y: 10}), 'M0,10 40,0 50,30 10,40Z')
})

test('calculates transformed side midpoints', t => {
  t.deepEqual(sideMidpoint(quad, 'top'), {x: 30, y: 15})
  t.deepEqual(sideMidpoint(quad, 'right'), {x: 55, y: 25})
  t.deepEqual(sideMidpoint(quad, 'bottom'), {x: 40, y: 45})
  t.deepEqual(sideMidpoint(quad, 'left'), {x: 15, y: 35})
})

test('uses getBoxQuads when the element provides a quad', t => {
  const element = {
    getBoxQuads: options => {
      t.deepEqual(options, {box: 'padding'})
      return [quad]
    },
  }

  t.is(getBoxQuad(element, 'padding'), quad)
})

test('falls back to getBoundingClientRect for an empty quad list', t => {
  const element = {
    getBoxQuads: () => [],
    getBoundingClientRect: () => ({left: 1, right: 5, top: 2, bottom: 8}),
  }

  t.deepEqual(getBoxQuad(element), {
    p1: {x: 1, y: 2},
    p2: {x: 5, y: 2},
    p3: {x: 5, y: 8},
    p4: {x: 1, y: 8},
  })
})
