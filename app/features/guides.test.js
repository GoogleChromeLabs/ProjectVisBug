import test from 'ava'

import { setupPptrTab, teardownPptrTab } 
from '../../tests/helpers'

test.beforeEach(setupPptrTab)

test('Should show 1 overlay element on hover', async t => {
  const { page } = t.context

  await page.mouse.move(100, 200)

  const gridlines_element = await page.evaluate(`document.querySelectorAll('visbug-gridlines').length`)

  t.is(gridlines_element, 1)
  t.pass()
})

test.afterEach(teardownPptrTab)
