import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getLatestComicNumber,
  parseComicRecord,
  parseRssFeed,
  updateArchiveIndex,
  type ArchiveCheckpoint,
  type XkcdComic,
} from '../src/lib/xkcd.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = resolve(root, 'public/xkcd-index.json')
const checkpointPath = resolve(root, '.xkcd-index-progress.json')
const baseUrl = process.env.XKCD_API_BASE_URL ?? 'https://xkcd.com'
const concurrency = 12

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw error
  }
}

async function writeJsonAtomically(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(data)}\n`, 'utf8')
  try {
    await rename(temporaryPath, path)
  } catch (error) {
    if (process.platform !== 'win32' || (error as NodeJS.ErrnoException).code !== 'EPERM') throw error
    const backupPath = `${path}.backup-${process.pid}-${Date.now()}`
    await rename(path, backupPath)
    try {
      await rename(temporaryPath, path)
    } catch (replaceError) {
      await rename(backupPath, path)
      throw replaceError
    }
    await rm(backupPath, { force: true })
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'user-agent': 'xkcd-calendar-indexer/1.0' } })
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`)
  return response.text()
}

async function fetchComic(number: number): Promise<unknown> {
  const url = `${baseUrl}/${number}/info.0.json`
  const response = await fetch(url, { headers: { 'user-agent': 'xkcd-calendar-indexer/1.0' } })
  if (!response.ok) throw new Error(`Request failed (${response.status}) for comic #${number}`)
  return response.json()
}

async function main(): Promise<void> {
  const feed = parseRssFeed(await fetchText(`${baseUrl}/rss.xml`))
  const latestNumber = getLatestComicNumber(feed)
  const existing = (await readJson<XkcdComic[]>(indexPath, [])).map(parseComicRecord)
  const checkpoint = await readJson<ArchiveCheckpoint | null>(checkpointPath, null)
  const records = checkpoint?.records.map(parseComicRecord) ?? existing
  const nextNumber = checkpoint?.nextNumber ?? Math.max(0, ...records.map(({ num }) => num)) + 1

  console.log(`Updating XKCD index through comic #${latestNumber} (starting at #${nextNumber}).`)
  const updated = await updateArchiveIndex({
    records,
    nextNumber,
    latestNumber,
    fetchComic,
    batchSize: concurrency,
    onCheckpoint: async (progress) => {
      await writeJsonAtomically(indexPath, progress.records)
      await writeJsonAtomically(checkpointPath, progress)
      if ((progress.nextNumber - 1) % 120 < concurrency || progress.nextNumber > latestNumber) {
        console.log(`Indexed through comic #${progress.nextNumber - 1}.`)
      }
    },
  })

  await writeJsonAtomically(indexPath, updated)
  await rm(checkpointPath, { force: true })
  console.log(`Wrote ${updated.length} comics to ${indexPath}.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
