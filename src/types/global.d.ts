/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { Config } from '@/types/data'

declare global {
  var config: Config
}

export {}
