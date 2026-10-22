import type { Attachment } from 'svelte/attachments'

export function drag({ onChange: mousemove }: { onChange: (e: MouseEvent) => void }): Attachment {
  return function (element) {
    let cleanup: (() => void) | null = null

    function mouseup() {
      cleanup?.()
      cleanup = null
    }

    function mousedown() {
      if (cleanup) return

      const userSelect = window.document.body.style.userSelect
      window.addEventListener('mousemove', mousemove)
      window.addEventListener('mouseup', mouseup)
      window.addEventListener('blur', mouseup)
      window.document.body.style.userSelect = 'none'

      cleanup = () => {
        window.removeEventListener('mousemove', mousemove)
        window.removeEventListener('mouseup', mouseup)
        window.removeEventListener('blur', mouseup)
        window.document.body.style.userSelect = userSelect
      }
    }
    element.addEventListener('mousedown', mousedown)

    return function () {
      element.removeEventListener('mousedown', mousedown)
      mouseup()
    }
  }
}

export function scroll({ value, onChange }: { value?: number; onChange: (value: number) => void }): Attachment {
  return function (element) {
    function scroll() {
      const value = element.scrollTop
      onChange(value)
    }
    element.addEventListener('scroll', scroll)

    if (value !== undefined) {
      $effect(() => {
        if (element.scrollTop !== value) {
          element.scrollTop = value
        }
      })
    }

    return function () {
      element.removeEventListener('scroll', scroll)
    }
  }
}

export function resize({ onChange }: { onChange: (rect: DOMRectReadOnly) => void }): Attachment {
  return function (element) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onChange(entry.contentRect)
      }
    })
    observer.observe(element)

    return function () {
      observer.disconnect()
    }
  }
}
