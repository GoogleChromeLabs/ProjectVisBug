import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode }
from '../../tests/helpers'

const test_selector   = '[intro] b'

test.beforeEach(setupPptrTab)

test('Can show 1 label on click', async t => {
  await changeMode({tool: 'font', page: t.context.page})
  const { page } = t.context

  await page.click(test_selector)

  const label_element = await page.evaluate(`document.querySelectorAll('visbug-label').length`)

  t.is(label_element, 1)
  t.pass()
})

test('Can show tag name label on click', async t => {
  await changeMode({tool: 'font', page: t.context.page})
  const { page } = t.context

  await page.click(test_selector)

  const label_element = await page.evaluate(
    `document.querySelector('visbug-label').$shadow.querySelector('span a').textContent`
  );

  t.is(label_element, 'b');
  t.pass()
})

test('Can show layout property label on click', async t => {
  await changeMode({tool: 'align', page: t.context.page})
  const { page } = t.context

  await page.click(test_selector)

  const label_element = await page.evaluate(
    `document.querySelector('visbug-label').$shadow.querySelector('span').textContent`
  );

  t.is(label_element, 'inline');
  t.pass()
})

test('Can show proper tag name label after position tool clicked', async t => {
  await changeMode({tool: 'position', page: t.context.page})
  const { page } = t.context

  await page.click(test_selector)

  const label_element = await page.evaluate(
    `document.querySelector('visbug-label').$shadow.querySelector('span a').textContent`
  );

  t.is(label_element, "b");
  t.pass();
})

test.afterEach(teardownPptrTab)
