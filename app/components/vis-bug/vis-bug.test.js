import test from 'ava'

import { setupPptrTab, teardownPptrTab, getActiveTool } 
from '../../../tests/helpers'

test.beforeEach(setupPptrTab)

test('Should have guides as default tool', async t => {
  const { page } = t.context
  t.is(await getActiveTool(page), 'guides')
})

test.afterEach(teardownPptrTab)
