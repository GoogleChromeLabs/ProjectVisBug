document.querySelectorAll('vis-bug')
  .forEach(node => {
    node.animate(
      [{transform: 'translateX(-200%)', opacity:0}],
      {
        duration: 300,
        easing: 'ease-out',
      }).onfinish = e => node.remove()
  })
