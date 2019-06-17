import test from 'ava'

import { setupPptrTab, teardownPptrTab, changeMode, getActiveTool }
from '../../tests/helpers'

const tool            = 'position'
const test_selector   = '[intro] h1'

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

test('Test Nudge Up/Down Works', async t => {
  const { page } = t.context

  const originalPageTop = await page.$eval(test_selector, el => el.getBoundingClientRect().top)
  await page.click(test_selector)

  await page.keyboard.press('ArrowUp')
  const changedPageTop = await page.$eval(test_selector, el => el.getBoundingClientRect().top)
  t.true(originalPageTop - 1 === changedPageTop)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  const finalPageTop = await page.$eval(test_selector, el => el.getBoundingClientRect().top)
  t.true(originalPageTop + 1 === finalPageTop)

  t.pass()
})

test('Test Nudge Left/Right Works', async t => {
  const { page } = t.context

  const originalPageLeft = await page.$eval(test_selector, el => el.getBoundingClientRect().left)
  await page.click(test_selector)

  await page.keyboard.press('ArrowLeft')
  const changedPageLeft = await page.$eval(test_selector, el => el.getBoundingClientRect().left)
  t.true(originalPageLeft - 1 === changedPageLeft)

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  const finalPageLeft = await page.$eval(test_selector, el => el.getBoundingClientRect().left)
  t.true(originalPageLeft + 1 === finalPageLeft)

  t.pass()
})

test('Test Shift Nudge Up/Down Works', async t => {
  const { page } = t.context

  const originalPageTop = await page.$eval(test_selector, el => el.getBoundingClientRect().top)
  await page.click(test_selector)
  await page.keyboard.down("Shift")
  await page.keyboard.press('ArrowUp')
  const changedPageTop = await page.$eval(test_selector, el => el.getBoundingClientRect().top)
  t.true(originalPageTop - 10 === changedPageTop)
  t.pass()
})


test('Test Drag Works', async t => {
  const { page } = t.context

  const { originalTop, originalLeft } = await page.$eval(test_selector, el => {
    return {
      originalTop : el.getBoundingClientRect().top,
      originalLeft : el.getBoundingClientRect().left
    }
  })

  await page.click(test_selector)

  await page.mouse.down()
  await page.mouse.move(20,20)
  const changedPageTop = await page.$eval(test_selector, el => el.getBoundingClientRect().top)
  const changedPageLeft = await page.$eval(test_selector, el => el.getBoundingClientRect().left)

  t.true(changedPageTop + 50 < originalTop)
  t.true(changedPageLeft + 50 < originalLeft)

  t.pass()
})



test.afterEach(teardownPptrTab)
