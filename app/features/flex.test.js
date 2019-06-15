import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool }
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
  t.true(justifyStr == "center")

  await page.keyboard.press('ArrowRight')
  justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr == "flex-end")

  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr == "flex-start")

  t.pass()
})


test('Can adjust align-items', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.press('ArrowDown')
  let alignStr = await page.$eval(test_selector, el => el.style.alignItems)
  t.true(alignStr == "center")

  await page.keyboard.press('ArrowDown')
  alignStr = await page.$eval(test_selector, el => el.style.alignItems)
  t.true(alignStr == "flex-end")

  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  alignStr = await page.$eval(test_selector, el => el.style.alignItems)
  t.true(alignStr == "flex-start")

  t.pass()
})


test('Can apply space-around', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  let justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr == "space-around")

  t.pass()
})


test('Can apply space-between', async t => {
  const { page } = t.context

  await page.click(test_selector)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  let justifyStr = await page.$eval(test_selector, el => el.style.justifyContent)
  t.true(justifyStr == "space-between")

  t.pass()
})



test.afterEach(teardownPptrTab)
