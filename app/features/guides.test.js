import test from 'ava'

import { setupPptrTab, teardownPptrTab } 
from '../../tests/helpers'

test.beforeEach(setupPptrTab)

test('Should show 2 overlay elements on hover', async t => {
  const { page } = t.context

  await page.mouse.move(100, 200)

  const gridlines_element = await page.evaluate(`document.querySelectorAll('visbug-gridlines').length`)
  const label_elements = await page.evaluate(`document.querySelectorAll('visbug-label').length`)

  t.is(gridlines_element, 1)
  t.is(label_elements, 1)
  t.pass()
})

test.afterEach(teardownPptrTab)