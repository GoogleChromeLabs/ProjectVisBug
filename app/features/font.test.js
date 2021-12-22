import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool, pptrMetaKey }
from '../../tests/helpers'

const tool            = 'font'
const test_selector   = '[intro] b'

const getInlineStyle = async (page, prop) =>
  await page.$eval(test_selector, (el, prop) => {
    return el.style[prop]
  }, prop)

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

test('Can Be Deactivated', async t => {
  const { page } = t.context

  t.is(await getActiveTool(page), tool)
  await changeMode({ tool: 'padding', page })
  t.is(await getActiveTool(page), 'padding')

  t.pass()
})

test('Can change size', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getInlineStyle(page, 'font-size'), '')

  await page.keyboard.press('ArrowUp')
  t.is(await getInlineStyle(page, 'font-size'), '17px')

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  t.is(await getInlineStyle(page, 'font-size'), '15px')

  t.pass()
})

test('Can change alignment', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getInlineStyle(page, 'text-align'), '')

  await page.keyboard.press('ArrowRight')
  t.is(await getInlineStyle(page, 'text-align'), 'right')

  await page.keyboard.press('ArrowLeft')
  t.is(await getInlineStyle(page, 'text-align'), 'center')

  await page.keyboard.press('ArrowLeft')
  t.is(await getInlineStyle(page, 'text-align'), 'left')

  t.pass()
})

test('Can change leading', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getInlineStyle(page, 'line-height'), '')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Shift')
  t.is(await getInlineStyle(page, 'line-height'), '20px')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.up('Shift')
  t.is(await getInlineStyle(page, 'line-height'), '19px')

  t.pass()
})

test('Can change letter space', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getInlineStyle(page, 'letter-spacing'), '')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.up('Shift')
  t.is(await getInlineStyle(page, 'letter-spacing'), '1.6px')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.up('Shift')
  t.is(await getInlineStyle(page, 'letter-spacing'), '1.5px')

  t.pass()
})

test('Can change weight', async t => {
  const { page } = t.context
  const metaKey = await pptrMetaKey(page)

  await page.click(test_selector)
  t.is(await getInlineStyle(page, 'font-weight'), '')

  await page.keyboard.down(metaKey)
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up(metaKey)
  t.is(await getInlineStyle(page, 'font-weight'), '800')

  await page.keyboard.down(metaKey)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.up(metaKey)
  t.is(await getInlineStyle(page, 'font-weight'), '700')

  t.pass()
})

test.afterEach(teardownPptrTab)
