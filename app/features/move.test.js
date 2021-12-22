import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool } 
from '../../tests/helpers'

const tool            = 'move'
const test_selector   = '[intro] b'

const getNodeIndex = async (page, selector) =>
  await page.$eval(selector, el => 
    [...el.parentNode.children].indexOf(el))

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

test('Move sibling up the branch', async t => {
  const { page } = t.context

  await page.click(test_selector)
  t.is(await getNodeIndex(page, test_selector), 2)

  await page.keyboard.press('ArrowLeft')

  t.is(await getNodeIndex(page, test_selector), 1)

  t.pass()
})

test('Move sibling down the branch', async t => {
  const { page } = t.context
  const alt_selector = '[intro] em'

  await page.click(alt_selector)
  t.is(await getNodeIndex(page, alt_selector), 0)

  await page.keyboard.press('ArrowRight')

  t.is(await getNodeIndex(page, alt_selector), 1)

  t.pass()
})

test('Grips overlay siblings when 1 is selected', async t => {
  const { page } = t.context

  await page.click(test_selector)
  
  const grips_count = await page.evaluate('document.querySelectorAll("visbug-grip").length')

  t.is(grips_count, 3)

  t.pass()
})

test('Drag bounds are highlighted', async t => {
  const { page } = t.context

  await page.click(test_selector)
  
  const bounds_count = await page.evaluate('document.querySelectorAll("[visbug-drag-container]").length')

  t.is(bounds_count, 1)

  t.pass()
})

test.afterEach(teardownPptrTab)
