import { describe, expect, it, vi } from 'vitest'
import archiveIndex from '../public/xkcd-index.json'
import { adjacentMonth, isWithinCalendarBounds, makeCalendarDays } from '../src/lib/calendar'
import {
  createComicRepository,
  getComicYears,
  getLatestComicNumber,
  getMonthComics,
  parseComicRecord,
  parseRssFeed,
  updateArchiveIndex,
  type ArchiveCheckpoint,
} from '../src/lib/xkcd'

const comic = (num: number, day = 1) => ({
  num,
  year: '2024',
  month: '2',
  day: String(day),
  safe_title: `Comic ${num}`,
  title: `Comic ${num}`,
  img: `https://imgs.xkcd.com/comics/${num}.png`,
  alt: `Alt ${num}`,
})

describe('calendar dates and navigation', () => {
  it('creates the right number of dates for short, long, and leap February months', () => {
    expect(makeCalendarDays(2023, 2, []).filter(({ date }) => date > 0)).toHaveLength(28)
    expect(makeCalendarDays(2024, 2, []).filter(({ date }) => date > 0)).toHaveLength(29)
    expect(makeCalendarDays(2024, 4, []).filter(({ date }) => date > 0)).toHaveLength(30)
    expect(makeCalendarDays(2024, 1, []).filter(({ date }) => date > 0)).toHaveLength(31)
  })

  it('keeps blank leading dates and groups comics under their publication day', () => {
    const days = makeCalendarDays(2024, 2, [parseComicRecord(comic(2, 14))])
    expect(days[0].date).toBe(0)
    expect(days.find(({ date }) => date === 14)?.comics).toHaveLength(1)
    expect(days.find(({ date }) => date === 13)?.comics).toHaveLength(0)
  })

  it('crosses year boundaries and stops at archive and current month bounds', () => {
    expect(adjacentMonth(2024, 1, -1)).toEqual({ year: 2023, month: 12 })
    expect(adjacentMonth(2024, 12, 1)).toEqual({ year: 2025, month: 1 })
    expect(isWithinCalendarBounds(2005, 1, 2006, 2024, 6)).toBe(false)
    expect(isWithinCalendarBounds(2024, 7, 2006, 2024, 6)).toBe(false)
    expect(isWithinCalendarBounds(2024, 6, 2006, 2024, 6)).toBe(true)
  })
})

describe('XKCD source parsing', () => {
  it('normalizes valid JSON comic metadata', () => {
    expect(parseComicRecord(comic(7))).toMatchObject({
      num: 7,
      year: 2024,
      month: 2,
      day: 1,
      title: 'Comic 7',
      link: 'https://xkcd.com/7/',
    })
  })

  it('rejects malformed records and impossible dates', () => {
    expect(() => parseComicRecord({ ...comic(7), img: '' })).toThrow(/image URL/)
    expect(() => parseComicRecord({ ...comic(7), day: '30', month: '2' })).toThrow(/publication date/)
  })

  it('parses feed entries and discovers the highest comic number', () => {
    const feed = '<rss><channel><item><title>One</title><link>https://xkcd.com/1/</link></item><item><title>Two</title><link>https://xkcd.com/2/</link></item></channel></rss>'
    const entries = parseRssFeed(feed)
    expect(entries).toHaveLength(2)
    expect(getLatestComicNumber(entries)).toBe(2)
  })

  it('rejects an invalid or empty feed', () => {
    expect(() => parseRssFeed('<not-rss>')).toThrow(/valid XML/)
    expect(() => parseRssFeed('<rss><channel /></rss>')).toThrow(/no comic entries/)
  })
})

describe('resumable archive update', () => {
  it('writes idempotent checkpoints after each successful batch', async () => {
    const checkpoints: ArchiveCheckpoint[] = []
    const fetchComic = vi.fn(async (num: number) => comic(num))
    const records = await updateArchiveIndex({
      records: [parseComicRecord(comic(1))],
      nextNumber: 2,
      latestNumber: 4,
      fetchComic,
      batchSize: 2,
      onCheckpoint: async (checkpoint) => { checkpoints.push(checkpoint) },
    })

    expect(records.map(({ num }) => num)).toEqual([1, 2, 3, 4])
    expect(checkpoints.map(({ nextNumber }) => nextNumber)).toEqual([4, 5])
  })

  it('leaves the last checkpoint intact after a source failure and resumes from it', async () => {
    const checkpoints: ArchiveCheckpoint[] = []
    const onCheckpoint = async (checkpoint: ArchiveCheckpoint) => { checkpoints.push(checkpoint) }
    await expect(updateArchiveIndex({
      records: [],
      nextNumber: 1,
      latestNumber: 4,
      batchSize: 2,
      fetchComic: async (num) => {
        if (num === 4) throw new Error('source unavailable')
        return comic(num)
      },
      onCheckpoint,
    })).rejects.toThrow('source unavailable')

    expect(checkpoints.at(-1)?.nextNumber).toBe(3)
    const resumed = await updateArchiveIndex({
      records: checkpoints.at(-1)?.records ?? [],
      nextNumber: checkpoints.at(-1)?.nextNumber ?? 1,
      latestNumber: 4,
      batchSize: 2,
      fetchComic: async (num) => comic(num),
      onCheckpoint,
    })
    expect(resumed.map(({ num }) => num)).toEqual([1, 2, 3, 4])
  })

  it('skips the intentionally unassigned XKCD number 404', async () => {
    const fetchComic = vi.fn(async (num: number) => comic(num))
    const records = await updateArchiveIndex({
      records: [],
      nextNumber: 403,
      latestNumber: 405,
      fetchComic,
      onCheckpoint: async () => {},
    })
    expect(fetchComic.mock.calls.map(([num]) => num)).toEqual([403, 405])
    expect(records.map(({ num }) => num)).toEqual([403, 405])
  })
})

describe('month lookup and session cache', () => {
  it('filters by publication month and orders comics by number', () => {
    const records = [
      parseComicRecord(comic(12, 8)),
      parseComicRecord({ ...comic(3, 8), month: '3' }),
      parseComicRecord(comic(4, 8)),
    ]
    expect(getMonthComics(records, 2024, 2).map(({ num }) => num)).toEqual([4, 12])
    expect(getMonthComics(records, 2024, 3).map(({ num }) => num)).toEqual([3])
    expect(getMonthComics(records, 2024, 4)).toEqual([])
  })

  it('accepts leap day and rejects a nonexistent non-leap date', () => {
    expect(parseComicRecord({ ...comic(29), day: '29' }).day).toBe(29)
    expect(() => parseComicRecord({ ...comic(29), year: '2023', day: '29' })).toThrow(/publication date/)
  })

  it('includes all years from the oldest indexed comic through the current year', () => {
    expect(getComicYears([parseComicRecord(comic(1))], 2026)).toEqual(
      Array.from({ length: 3 }, (_, index) => 2024 + index),
    )
    expect(getComicYears([], 2026)).toEqual([2026])
  })

  it('loads newer feed records once and retains them in the session snapshot', async () => {
    const fetchFeed = vi.fn(async () => [{ num: 8, title: 'Recent', link: 'https://xkcd.com/8/' }])
    const fetchComic = vi.fn(async (num: number) => ({ ...comic(num, 9), month: '3' }))
    const repository = createComicRepository({
      initialRecords: [parseComicRecord(comic(7, 8))],
      fetchFeed,
      fetchComic,
    })

    expect(await repository.getMonth(2024, 2)).toHaveLength(1)
    expect(await repository.getMonth(2024, 2)).toHaveLength(1)
    expect(fetchFeed).toHaveBeenCalledTimes(1)
    expect(fetchComic).toHaveBeenCalledTimes(1)
    expect(repository.getSnapshot().map(({ num }) => num)).toEqual([7, 8])
    expect(repository.getLatestNumber()).toBe(8)
  })

  it('serves an older archive month and the latest indexed publication month', async () => {
    const latest = archiveIndex.reduce((current, record) => record.num > current.num ? record : current)
    const repository = createComicRepository({
      initialRecords: archiveIndex,
      fetchFeed: async () => [{ num: latest.num, title: latest.title, link: latest.link }],
      fetchComic: async () => { throw new Error('Indexed records should not be fetched again.') },
    })
    expect(await repository.getMonth(2006, 1)).not.toHaveLength(0)
    expect((await repository.getMonth(latest.year, latest.month)).some(({ num }) => num === latest.num)).toBe(true)
  })
})
