import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool }
from '../../tests/helpers'

const tool            = 'inspector'
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

test('Can Be Deactivated', async t => {
  const { page } = t.context

  t.is(await getActiveTool(page), tool)
  await changeMode({ tool: 'padding', page })
  t.is(await getActiveTool(page), 'padding')

  t.pass()
})

test('Should show 1 metatip on click', async t => {
  const { page } = t.context

  await page.click(test_selector)
  const metatip_element = await page.evaluate(`document.querySelectorAll('visbug-metatip').length`)

  t.is(metatip_element, 1)
  t.pass()
})

test('Should show tag name in header', async t => {
  const { page } = t.context

  await page.click(test_selector)
  const metatip_header_tag = await page.evaluate(
    `document.querySelector('visbug-metatip').$shadow.querySelector('figure > header a[node]').textContent`
  )

  t.is(metatip_header_tag, 'b')
  t.pass()
})

test.afterEach(teardownPptrTab)
