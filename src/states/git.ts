import type { ExtensionContext, Memento } from 'vscode'
const REPO_STATES = 'repoStates'

export interface GitRepoState {
  cdvDivider: number
  cdvHeight: number
  // columnWidths: ColumnWidth[] | null
  // commitOrdering: RepoCommitOrdering
  // fileViewType: FileViewType
  // hideRemotes: string[]
  // includeCommitsMentionedByReflogs: BooleanOverride
  // issueLinkingConfig: IssueLinkingConfig | null
  // lastImportAt: number
  // name: string | null
  // onlyFollowFirstParent: BooleanOverride
  // onRepoLoadShowCheckedOutBranch: BooleanOverride
  // onRepoLoadShowSpecificBranches: string[] | null
  // pullRequestConfig: PullRequestConfig | null
  // showRemoteBranches: boolean
  // showRemoteBranchesV2: BooleanOverride
  // showStashes: BooleanOverride
  // showTags: BooleanOverride
  // workspaceFolderIndex: number | null
}

type GitRepoSet = { [repo: string]: GitRepoState }

const DEFAULT_REPO_STATE: GitRepoState = {
  cdvDivider: 0.5,
  cdvHeight: 250,
  // columnWidths: null,
  // commitOrdering: RepoCommitOrdering.Default,
  // fileViewType: FileViewType.Default,
  // hideRemotes: [],
  // includeCommitsMentionedByReflogs: BooleanOverride.Default,
  // issueLinkingConfig: null,
  // lastImportAt: 0,
  // name: null,
  // onlyFollowFirstParent: BooleanOverride.Default,
  // onRepoLoadShowCheckedOutBranch: BooleanOverride.Default,
  // onRepoLoadShowSpecificBranches: null,
  // pullRequestConfig: null,
  // showRemoteBranches: true,
  // showRemoteBranchesV2: BooleanOverride.Default,
  // showStashes: BooleanOverride.Default,
  // showTags: BooleanOverride.Default,
  // workspaceFolderIndex: null
}

export class GitState {
  private readonly globalState: Memento
  private readonly workspaceState: Memento

  constructor(context: ExtensionContext) {
    this.globalState = context.globalState
    this.workspaceState = context.workspaceState
  }

  public getRepos() {
    const repoSet: GitRepoSet = {}
    // let showRemoteBranchesDefaultValue: boolean | null = null
    for (const [repo, value] of Object.entries(this.workspaceState.get<GitRepoSet>(REPO_STATES, {}))) {
      repoSet[repo] = Object.assign({}, DEFAULT_REPO_STATE, value)
      // if (
      //   typeof repoSet[repo].showRemoteBranchesV2 === 'undefined' &&
      //   typeof repoSet[repo].showRemoteBranches !== 'undefined'
      // ) {
      //   if (showRemoteBranchesDefaultValue === null) {
      //     showRemoteBranchesDefaultValue = getConfig().showRemoteBranches
      //   }
      //   if (repoSet[repo].showRemoteBranches !== showRemoteBranchesDefaultValue) {
      //     outputSet[repo].showRemoteBranchesV2 = repoSet[repo].showRemoteBranches
      //       ? BooleanOverride.Enabled
      //       : BooleanOverride.Disabled
      //   }
      // }
    }
    return repoSet
  }
}
