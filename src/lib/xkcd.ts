import { XMLParser, XMLValidator } from 'fast-xml-parser'

export interface XkcdComic {
  num: number
  year: number
  month: number
  day: number
  title: string
  img: string
  alt: string
  link: string
}

export interface FeedComic {
  num: number
  title: string
  link: string
}

export interface ArchiveCheckpoint {
  nextNumber: number
  records: XkcdComic[]
}

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  processEntities: true,
})

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Comic metadata must be a JSON object.')
  }
  return value as Record<string, unknown>
}

function positiveInteger(value: unknown, field: string): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Comic metadata has an invalid ${field}.`)
  }
  return number
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Comic metadata has an invalid ${field}.`)
  }
  return value.trim()
}

export function parseComicRecord(value: unknown): XkcdComic {
  const record = asRecord(value)
  const num = positiveInteger(record.num, 'comic number')
  const year = positiveInteger(record.year, 'year')
  const month = positiveInteger(record.month, 'month')
  const day = positiveInteger(record.day, 'day')
  const date = new Date(Date.UTC(year, month - 1, day))

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Comic #${num} has an invalid publication date.`)
  }

  return {
    num,
    year,
    month,
    day,
    title: nonEmptyString(record.safe_title ?? record.title, 'title'),
    img: nonEmptyString(record.img, 'image URL'),
    alt: typeof record.alt === 'string' ? record.alt : '',
    link: `https://xkcd.com/${num}/`,
  }
}

function extractNumber(link: unknown): number {
  if (typeof link !== 'string') throw new Error('RSS item has no comic link.')
  const match = link.match(/^https?:\/\/(?:www\.)?xkcd\.com\/(\d+)\/?$/i)
  if (!match) throw new Error(`RSS item has an invalid comic link: ${link}`)
  return positiveInteger(match[1], 'comic number')
}

export function parseRssFeed(xml: string): FeedComic[] {
  const validation = XMLValidator.validate(xml)
  if (validation !== true) throw new Error('XKCD RSS feed is not valid XML.')

  const parsed = asRecord(parser.parse(xml))
  const rss = asRecord(parsed.rss)
  const channel = typeof rss.channel === 'object' && rss.channel !== null
    ? asRecord(rss.channel)
    : {}
  const rawItems = channel.item
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []
  if (items.length === 0) throw new Error('XKCD RSS feed contains no comic entries.')

  return items.map((rawItem) => {
    const item = asRecord(rawItem)
    const link = nonEmptyString(item.link, 'RSS comic link')
    return {
      num: extractNumber(link),
      title: nonEmptyString(item.title, 'RSS comic title'),
      link,
    }
  })
}

export function getLatestComicNumber(items: FeedComic[]): number {
  if (items.length === 0) throw new Error('No XKCD feed entries are available.')
  return Math.max(...items.map((item) => item.num))
}

export function normalizeArchive(records: XkcdComic[]): XkcdComic[] {
  const byNumber = new Map<number, XkcdComic>()
  for (const record of records) byNumber.set(record.num, record)
  return [...byNumber.values()].sort((left, right) => left.num - right.num)
}

export async function updateArchiveIndex(options: {
  records: XkcdComic[]
  nextNumber: number
  latestNumber: number
  fetchComic: (number: number) => Promise<unknown>
  onCheckpoint: (checkpoint: ArchiveCheckpoint) => Promise<void>
  batchSize?: number
}): Promise<XkcdComic[]> {
  let records = normalizeArchive(options.records)
  let nextNumber = options.nextNumber
  const batchSize = options.batchSize ?? 20

  while (nextNumber <= options.latestNumber) {
    const batchEnd = Math.min(nextNumber + batchSize - 1, options.latestNumber)
    const fetched = await Promise.all(
      Array.from({ length: batchEnd - nextNumber + 1 }, (_, index) => nextNumber + index)
        .filter((number) => number !== 404)
        .map((number) => options.fetchComic(number).then(parseComicRecord)),
    )
    records = normalizeArchive([...records, ...fetched])
    nextNumber = batchEnd + 1
    await options.onCheckpoint({ nextNumber, records })
  }

  return records
}

export function getMonthComics(records: XkcdComic[], year: number, month: number): XkcdComic[] {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12.')
  }
  return normalizeArchive(records.filter((comic) => comic.year === year && comic.month === month))
}

export function getComicYears(records: XkcdComic[], currentYear: number): number[] {
  const firstYear = records.length > 0
    ? Math.min(...records.map(({ year }) => year))
    : currentYear
  return Array.from({ length: Math.max(1, currentYear - firstYear + 1) }, (_, index) => firstYear + index)
}

export function createComicRepository(options: {
  initialRecords: XkcdComic[]
  fetchFeed: () => Promise<FeedComic[]>
  fetchComic: (number: number) => Promise<unknown>
}) {
  const cache = new Map<number, XkcdComic>()
  for (const record of normalizeArchive(options.initialRecords)) cache.set(record.num, record)
  let feedCache: FeedComic[] | undefined

  async function recentFeed(): Promise<FeedComic[]> {
    if (!feedCache) feedCache = await options.fetchFeed()
    return feedCache
  }

  return {
    async getMonth(year: number, month: number): Promise<XkcdComic[]> {
      const feed = await recentFeed()
      const missing = feed.filter(({ num }) => !cache.has(num))
      const fresh = await Promise.all(missing.map(async ({ num }) => {
        const record = parseComicRecord(await options.fetchComic(num))
        if (record.num !== num) throw new Error(`XKCD returned comic #${record.num} when #${num} was requested.`)
        return record
      }))
      for (const record of fresh) cache.set(record.num, record)
      return getMonthComics([...cache.values()], year, month)
    },
    getSnapshot(): XkcdComic[] {
      return normalizeArchive([...cache.values()])
    },
    getLatestNumber(): number {
      return cache.size > 0 ? Math.max(...cache.keys()) : 0
    },
    clearFeedCache(): void {
      feedCache = undefined
    },
  }
}

export async function fetchComicIndex(): Promise<XkcdComic[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}xkcd-index.json`)
  if (!response.ok) throw new Error(`Archive index request failed (${response.status}).`)
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Archive index is not a list.')
  return normalizeArchive(data.map(parseComicRecord))
}

export async function fetchFeed(): Promise<FeedComic[]> {
  const response = await fetch('/api/xkcd/rss.xml')
  if (!response.ok) throw new Error(`XKCD feed request failed (${response.status}).`)
  return parseRssFeed(await response.text())
}

export async function fetchComic(number: number): Promise<unknown> {
  if (!Number.isInteger(number) || number < 1) throw new Error('Comic number must be a positive integer.')
  const response = await fetch(`/api/xkcd/${number}/info.0.json`)
  if (!response.ok) throw new Error(`Comic #${number} request failed (${response.status}).`)
  return response.json()
}
