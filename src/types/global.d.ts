/// <reference types="svelte" />

import type { Runtime } from '@/utils/runtime'
import type * as L10n from '@vscode/l10n'

declare global {
  var l10n: typeof L10n
  var runtime: Runtime
}
