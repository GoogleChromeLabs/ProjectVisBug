import $ from 'blingblingjs'

const state = {
  distances:  [],
  target:     null,
}

export function createMeasurements({$anchor, $target}) {
  if (state.target == $target && state.distances.length) return
  else state.target = $target

  if (state.distances.length) clearMeasurements()

  const anchorBounds = $anchor.getBoundingClientRect()
  const targetBounds = $target.getBoundingClientRect()

  const measurements = []
  const midOffset = 2.5

  // right
  if (anchorBounds.right < targetBounds.left) {
    measurements.push({
      x: anchorBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - midOffset,
      d: targetBounds.left - anchorBounds.right,
      q: 'right',
    })
  }
  if (anchorBounds.right < targetBounds.right && anchorBounds.right > targetBounds.left) {
    measurements.push({
      x: anchorBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - midOffset,
      d: targetBounds.right - anchorBounds.right,
      q: 'right',
    })
  }

  // left
  if (anchorBounds.left > targetBounds.right) {
    measurements.push({
      x: targetBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - midOffset,
      d: anchorBounds.left - targetBounds.right,
      q: 'left',
    })
  }
  else if (anchorBounds.left > targetBounds.left && anchorBounds.left < targetBounds.right) {
    measurements.push({
      x: targetBounds.left,
      y: anchorBounds.top + (anchorBounds.height / 2) - midOffset,
      d: anchorBounds.left - targetBounds.left,
      q: 'left',
    })
  }

  // top
  if (anchorBounds.top > targetBounds.bottom) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - midOffset,
      y: targetBounds.bottom,
      d: anchorBounds.top - targetBounds.bottom,
      q: 'top',
      v: true,
    })
  }
  if (anchorBounds.top > targetBounds.top && anchorBounds.top < targetBounds.bottom) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - midOffset,
      y: targetBounds.top,
      d: anchorBounds.top - targetBounds.top,
      q: 'top',
      v: true,
    })
  }

  // bottom
  if (anchorBounds.bottom < targetBounds.top) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - midOffset,
      y: anchorBounds.bottom,
      d: targetBounds.top - anchorBounds.bottom,
      q: 'bottom',
      v: true,
    })
  }
  if (anchorBounds.bottom < targetBounds.bottom && anchorBounds.bottom > targetBounds.top) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - midOffset,
      y: anchorBounds.bottom,
      d: targetBounds.bottom - anchorBounds.bottom,
      q: 'bottom',
      v: true,
    })
  }

  // inside left/right
  if (anchorBounds.right > targetBounds.right && anchorBounds.left < targetBounds.left) {
    measurements.push({
      x: targetBounds.right,
      y: anchorBounds.top + (anchorBounds.height / 2) - midOffset,
      d: anchorBounds.right - targetBounds.right,
      q: 'left',
    })
    measurements.push({
      x: anchorBounds.left,
      y: anchorBounds.top + (anchorBounds.height / 2) - midOffset,
      d: targetBounds.left - anchorBounds.left,
      q: 'right',
    })
  }

  // inside top/right
  if (anchorBounds.top < targetBounds.top && anchorBounds.bottom > targetBounds.bottom) {
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - midOffset,
      y: anchorBounds.top,
      d: targetBounds.top - anchorBounds.top,
      q: 'bottom',
      v: true,
    })
    measurements.push({
      x: anchorBounds.left + (anchorBounds.width / 2) - midOffset,
      y: targetBounds.bottom,
      d: anchorBounds.bottom - targetBounds.bottom,
      q: 'top',
      v: true,
    })
  }

  // create custom elements for all created measurements
  measurements
    .map(measurement => Object.assign(measurement, {
      d: Math.round(measurement.d.toFixed(1) * 100) / 100,
    }))
    .forEach(measurement => {
      const $measurement = document.createElement('visbug-distance')

      $measurement.position = {
        line_model:     measurement,
        node_label_id:  state.distances.length,
      }

      document.body.appendChild($measurement)
      $measurement.isPopover()
      state.distances[state.distances.length] = $measurement
    })
}

export function clearMeasurements() {
  if (!state.distances) return

  $('[data-measuring]').forEach(el =>
    el.removeAttribute('data-measuring'))

  state.distances.forEach(node => node.remove())
  state.distances = []
}

export function takeMeasurementOwnership() {
  const distances = [...state.distances]
  state.distances = []
  return distances
}
