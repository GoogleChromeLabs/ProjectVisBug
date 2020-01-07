import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool }
from '../../tests/helpers'

const tool            = 'text'
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

test('Can insert text content', async t => {
  const { page } = t.context

  await page.click(test_selector)

  await page.keyboard.type('foo')

  t.true((await page.$eval(test_selector, el => el.innerHTML)).includes('foo'))

  t.pass()
})


test('Can delete text content', async t => {
  const { page } = t.context

  const original = await page.$eval(test_selector, el => el.innerHTML)

  await page.click(test_selector)

  await page.keyboard.press('Delete')
  await page.keyboard.press('Delete')

  const now = await page.$eval(test_selector, el => el.innerHTML)

  t.true(original.length === now.length + 2)

  t.pass()
})


test.afterEach(teardownPptrTab)
