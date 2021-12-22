import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool }
from '../../tests/helpers'

const tool            = 'padding'
const test_selector   = '[intro] b'

const getPaddingTop = async page =>
  await page.$eval(test_selector, el =>
    el.style.paddingTop)

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
  await changeMode({ tool: 'margin', page })
  t.is(await getActiveTool(page), 'margin')

  t.pass()
})

test('Adds padding to side', async t => {
  const { page } = t.context

  await page.click(test_selector)

  t.is(await getPaddingTop(page), '')

  await page.keyboard.press('ArrowUp')

  t.is(await getPaddingTop(page), '1px')

  t.pass()
})

test('Remove padding from side', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getPaddingTop(page), '')

  await page.keyboard.press('ArrowUp')
  t.is(await getPaddingTop(page), '1px')

  await page.keyboard.down('Alt')
  await page.keyboard.down('ArrowUp')
  await page.keyboard.up('Alt')
  await page.keyboard.up('ArrowUp')
  t.is(await getPaddingTop(page), '0px')

  t.pass()
})

test('Can change values by 10 with shift key', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getPaddingTop(page), '')

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.up('Shift')
  t.is(await getPaddingTop(page), '10px')

  t.pass()
})

test.afterEach(teardownPptrTab)
