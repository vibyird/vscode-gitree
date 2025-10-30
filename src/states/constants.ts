export const ID = 'gitree'

export const NAME = 'Gitree'

export const L10N = process.env.L10N

export const GRAPH_VIEW = 'graph'

export const SETTINGS_VIEW = 'settings'

export const GRAPH_VIEW_ID = `${ID}.${GRAPH_VIEW}`

export const SETTINGS_PANEL_ID = `${ID}.${SETTINGS_VIEW}`

export const COMMAND_VIEW = `${ID}.view`

export const COMMAND_GRAPH_REFRESH = `${ID}.${GRAPH_VIEW}.refresh`

export const COMMAND_SETTINGS = SETTINGS_PANEL_ID

export const COMMAND_CREATE_BRANCH = `${ID}.branch`

export const COMMAND_CREATE_TAG = `${ID}.tag`

export const COMMAND_RESET = `${ID}.reset`

export const COMMAND_REBASE = `${ID}.rebase`

export const COMMAND_MERGE = `${ID}.merge`

export const GRAPH_COLORS: string[] = [
  'rgba(21, 160, 191, 1)',
  'rgba(6, 105, 247, 1)',
  'rgba(142, 0, 194, 1)',
  'rgba(197, 23, 182, 1)',
  'rgba(217, 1, 113, 1)',
  'rgba(205, 1, 1, 1)',
  'rgba(243, 93, 46, 1)',
  'rgba(242, 202, 51, 1)',
  'rgba(123, 217, 56, 1)',
  'rgba(46, 206, 157, 1)',
]
