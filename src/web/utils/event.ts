export function keydown(e: KeyboardEvent, callback: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    callback()
  }
}

export function drag(callback: (e: MouseEvent) => void): void {
  let dragging: boolean = false

  function mousemove(e: MouseEvent) {
    if (!dragging) return
    callback(e)
  }

  function mouseup() {
    dragging = false
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
    document.body.style.userSelect = ''
  }

  dragging = true

  document.addEventListener('mousemove', mousemove)
  document.addEventListener('mouseup', mouseup)
  // 防止选中文本
  document.body.style.userSelect = 'none'
}
