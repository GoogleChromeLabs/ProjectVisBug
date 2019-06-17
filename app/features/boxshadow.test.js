import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool, pptrMetaKey }
from '../../tests/helpers'

const tool            = 'boxshadow'
const test_selector   = '[intro] b'

const getShadowValues = async (page, testEl = test_selector) => {
  const shadowStr = await page.$eval(testEl, el => el.style.boxShadow)
  return parseShadowValues(shadowStr)
}

const parseShadowValues = (str) => {
  const [,color,x,y,blur,spread,inset] = /([^\)]+\)) ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+)( inset)?/.exec(str)
  return { color, x, y, blur, spread, inset : inset !== undefined }
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
  let shadow = await getShadowValues(page)
  t.true(shadow.x === "1px")
  //test shift case
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  shadow = await getShadowValues(page)
  t.true(shadow.x === "11px")

  t.pass()
})


test('Can adjust Y position', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  let shadow = await getShadowValues(page)
  t.true(shadow.y === "1px")
  //test shift case
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowDown')
  shadow = await getShadowValues(page)
  t.true(shadow.y === "11px")

  t.pass()
})

test('Shadow Blur Works', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.down('Alt')
  await page.keyboard.press('ArrowUp')
  let shadow = await getShadowValues(page)
  t.true(shadow.blur === "1px")
  //test shift case
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  shadow = await getShadowValues(page)
  t.true(shadow.blur === "11px")

  t.pass()
})

test('Shadow Spread Works', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.down('Alt')
  await page.keyboard.press('ArrowRight')
  let shadow = await getShadowValues(page)
  t.true(shadow.spread === "1px")
  //test shift case
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  shadow = await getShadowValues(page)
  t.true(shadow.spread === "11px")

  t.pass()
})

test('Shadow can be set to inset', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.down(await pptrMetaKey(page))
  await page.keyboard.press('ArrowDown')
  const shadow = await getShadowValues(page)
  t.true(shadow.inset)

  t.pass()
})


test.afterEach(teardownPptrTab)
