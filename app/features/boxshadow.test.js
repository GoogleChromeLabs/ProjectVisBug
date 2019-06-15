import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool }
from '../../tests/helpers'

const tool            = 'boxshadow'
const test_selector   = '[intro] b'

const getShadowValues = (str) => {
    const pattern = /([^\)]+\)) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+)/
    const matches = pattern.exec(str)

    return {
        color : matches[1],
        x : matches[2],
        y : matches[3],
        blur : matches[4],
        spread : matches[5],
    }
}

test.beforeEach(async t => {
  await setupPptrTab(t)

  await changeMode({
    tool,
    page: t.context.page,
  })
})

test('Can Be Activated', async t => {
  const { page } = t.context
  t.is(await getActiveTool(page), tool)
  t.pass()
})

test('Can adjust X position', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowRight')
  const shadowStr = await page.$eval(test_selector, el => el.style.boxShadow)
  const shadow = getShadowValues(shadowStr)
  t.true(shadow.x == "1px")

  t.pass()
})


test('Can adjust Y position', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  const shadowStr = await page.$eval(test_selector, el => el.style.boxShadow)
  const shadow = getShadowValues(shadowStr)
  t.true(shadow.y == "1px")

  t.pass()
})

test('Shadow Blur Works', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  const shadowStr = await page.$eval(test_selector, el => el.style.boxShadow)
  const shadow = getShadowValues(shadowStr)
  console.log(shadow)
  t.true(shadow.blur == "1px")

  t.pass()
})

test('Shadow Spread Works', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  const shadowStr = await page.$eval(test_selector, el => el.style.boxShadow)
  const shadow = getShadowValues(shadowStr)
  t.true(shadow.spread == "1px")

  t.pass()
})


test.afterEach(teardownPptrTab)
