export function keydown(e: KeyboardEvent, callback: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    callback()
  }
}
