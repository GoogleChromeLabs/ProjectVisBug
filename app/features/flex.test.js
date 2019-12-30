import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool, pptrMetaKey }
from '../../tests/helpers'

const tool            = 'align'
const test_selector   = '[intro] b'


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


test('Can adjust justify-content', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowRight')
  let justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr === "center")

  await page.keyboard.press('ArrowRight')
  justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr === "flex-end")

  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr === "flex-start")

  t.pass()
})


test('Can adjust align-items', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  let alignStr = await page.$eval(test_selector, el => el.style.alignItems)
  t.true(alignStr === "center")

  await page.keyboard.press('ArrowDown')
  alignStr = await page.$eval(test_selector, el => el.style.alignItems)
  t.true(alignStr === "flex-end")

  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  alignStr = await page.$eval(test_selector, el => el.style.alignItems)
  t.true(alignStr === "flex-start")

  t.pass()
})


test('Can apply space-around', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  let justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr === "space-around")

  t.pass()
})


test('Can apply space-between', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  let justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr === "space-between")

  t.pass()
})

test('Can adjust wrapping', async t => {
  const { page } = t.context
  const metaKey = await pptrMetaKey(page)

  await page.click(test_selector)
  await page.keyboard.down(metaKey)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  let wrapStr = await page.$eval(test_selector, el => el.style.flexWrap)
  t.true(wrapStr === 'nowrap')

  await page.keyboard.press('ArrowUp')
  wrapStr = await page.$eval(test_selector, el => el.style.flexWrap)
  t.true(wrapStr === 'nowrap')

  await page.keyboard.press('ArrowDown')
  wrapStr = await page.$eval(test_selector, el => el.style.flexWrap)
  t.true(wrapStr === 'wrap')

  await page.keyboard.press('ArrowDown')
  wrapStr = await page.$eval(test_selector, el => el.style.flexWrap)
  t.true(wrapStr === 'wrap')

  t.pass()
})

test('Can adjust row order', async t => {
  const { page } = t.context
  const metaKey = await pptrMetaKey(page)

  await page.click(test_selector)
  await page.keyboard.down(metaKey)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  let dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'row-reverse')

  await page.keyboard.press('ArrowLeft')
  dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'row-reverse')

  await page.keyboard.press('ArrowRight')
  dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'row')

  await page.keyboard.press('ArrowRight')
  dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'row')

  t.pass()
})

test('Can adjust column order', async t => {
  const { page } = t.context
  const metaKey = await pptrMetaKey(page)

  await page.click(test_selector)
  await page.keyboard.down(metaKey)
  await page.keyboard.press('ArrowUp')
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  let dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'column-reverse')

  await page.keyboard.press('ArrowLeft')
  dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'column-reverse')

  await page.keyboard.press('ArrowRight')
  dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'column')

  await page.keyboard.press('ArrowRight')
  dirStr = await page.$eval(test_selector, el => el.style.flexDirection)
  t.true(dirStr === 'column')

  t.pass()
})


test.afterEach(teardownPptrTab)
