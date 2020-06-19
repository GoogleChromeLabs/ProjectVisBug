export const isFixed = elem => {
  do {
    if (window.getComputedStyle(elem).position == 'fixed') return true;
  } while (elem = elem.offsetParent);
  return false;
}
