/**
 * The ISC License
 *
 * Copyright (c) 2016-2022 Isaac Z. Schlueter and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
 * IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

import { join, delimiter, sep, posix } from 'path'
import { Stats } from 'fs'
import { stat } from 'fs/promises'

const isWindows = process.platform === 'win32'

interface IsexeOptions {
  /**
   * Ignore errors arising from attempting to get file access status
   * Note that EACCES is always ignored, because that just means
   * it's not executable. If this is not set, then attempting to check
   * the executable-ness of a nonexistent file will raise ENOENT, for
   * example.
   */
  ignoreErrors?: boolean

  /**
   * effective uid when checking executable mode flags on posix
   * Defaults to process.getuid()
   */
  uid?: number

  /**
   * effective gid when checking executable mode flags on posix
   * Defaults to process.getgid()
   */
  gid?: number

  /**
   * effective group ID list to use when checking executable mode flags
   * on posix
   * Defaults to process.getgroups()
   */
  groups?: number[]

  /**
   * The ;-delimited path extension list for win32 implementation.
   * Defaults to process.env.PATHEXT
   */
  pathExt?: string
}

/**
 * Determine whether a path is executable based on the file extension
 * and PATHEXT environment variable (or specified pathExt option)
 */
export async function isexe(path: string, options: IsexeOptions = {}): Promise<boolean> {
  const { ignoreErrors = false } = options
  try {
    const fileStat = await stat(path)
    if (isWindows) {
      return fileStat.isFile() && checkPathExt(path, options)
    } else {
      return fileStat.isFile() && checkMode(fileStat, options)
    }
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES') return false
    throw er
  }
}

function checkPathExt(path: string, options: IsexeOptions) {
  const { pathExt = process.env.PATHEXT || '' } = options
  const peSplit = pathExt.split(';')
  if (peSplit.indexOf('') !== -1) {
    return true
  }

  for (let i = 0; i < peSplit.length; i++) {
    const p = peSplit[i].toLowerCase()
    const ext = path.substring(path.length - p.length).toLowerCase()

    if (p && ext === p) {
      return true
    }
  }
  return false
}

function checkMode(stat: Stats, options: IsexeOptions) {
  const myUid = options.uid ?? process.getuid?.()
  const myGroups = options.groups ?? process.getgroups?.() ?? []
  const myGid = options.gid ?? process.getgid?.() ?? myGroups[0]
  if (myUid === undefined || myGid === undefined) {
    throw new Error('cannot get uid or gid')
  }

  const groups = new Set([myGid, ...myGroups])

  const mod = stat.mode
  const uid = stat.uid
  const gid = stat.gid

  const u = parseInt('100', 8)
  const g = parseInt('010', 8)
  const o = parseInt('001', 8)
  const ug = u | g

  return !!(mod & o || (mod & g && groups.has(gid)) || (mod & u && uid === myUid) || (mod & ug && myUid === 0))
}

interface WhichOptions {
  path?: string
  pathExt?: string
  delimiter?: string
}

// used to check for slashed in commands passed in. always checks for the posix
// seperator on all platforms, and checks for the current separator when not on
// a posix platform. don't use the isWindows check for this since that is mocked
// in tests but we still need the code to actually work when called. that is also
// why it is ignored from coverage.
/* istanbul ignore next */
const rSlash = new RegExp(`[${posix.sep}${sep === posix.sep ? '' : sep}]`.replace(/(\\)/g, '\\$1'))
const rRel = new RegExp(`^\\.${rSlash.source}`)

function getNotFoundError(cmd: string) {
  return Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' })
}

function getPathInfo(cmd: string, opt: WhichOptions = {}) {
  const optPath = opt.path || process.env.PATH
  const optPathExt = opt.pathExt || process.env.PATHEXT
  const optDelimiter = opt.delimiter || delimiter
  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv = cmd.match(rSlash)
    ? ['']
    : [
        // windows always checks the cwd first
        ...(isWindows ? [process.cwd()] : []),
        ...(optPath || /* istanbul ignore next: very unusual */ '').split(optDelimiter),
      ]

  if (isWindows) {
    const pathExtExe = optPathExt || ['.EXE', '.CMD', '.BAT', '.COM'].join(optDelimiter)
    const pathExt = pathExtExe.split(optDelimiter).flatMap((item) => [item, item.toLowerCase()])
    if (cmd.includes('.') && pathExt[0] !== '') {
      pathExt.unshift('')
    }
    return { pathEnv, pathExt, pathExtExe }
  }

  return { pathEnv, pathExt: [''] }
}

function getPathPart(raw: string, cmd: string) {
  const pathPart = /^".*"$/.test(raw) ? raw.slice(1, -1) : raw
  const prefix = !pathPart && rRel.test(cmd) ? cmd.slice(0, 2) : ''
  return prefix + join(pathPart, cmd)
}

export async function which(cmd: string, opt: WhichOptions = {}): Promise<string> {
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)

  for (const envPart of pathEnv) {
    const p = getPathPart(envPart, cmd)

    for (const ext of pathExt) {
      const withExt = p + ext
      const is = await isexe(withExt, { pathExt: pathExtExe, ignoreErrors: true })
      if (is) {
        return withExt
      }
    }
  }
  throw getNotFoundError(cmd)
}
