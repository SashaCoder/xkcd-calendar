import type { XkcdComic } from './xkcd'

export type CalendarDay = { date: number; comics: XkcdComic[] }

export function makeCalendarDays(year: number, month: number, comics: XkcdComic[]): CalendarDay[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const offset = (firstWeekday + 6) % 7
  const count = new Date(year, month, 0).getDate()
  const byDay = new Map<number, XkcdComic[]>()
  for (const comic of comics) {
    const dayComics = byDay.get(comic.day) ?? []
    dayComics.push(comic)
    byDay.set(comic.day, dayComics)
  }
  return [
    ...Array.from({ length: offset }, () => ({ date: 0, comics: [] })),
    ...Array.from({ length: count }, (_, index) => ({ date: index + 1, comics: byDay.get(index + 1) ?? [] })),
  ]
}

export function adjacentMonth(year: number, month: number, delta: -1 | 1): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function isWithinCalendarBounds(
  year: number,
  month: number,
  firstYear: number,
  currentYear: number,
  currentMonth: number,
): boolean {
  const key = year * 12 + month
  return key >= firstYear * 12 + 1 && key <= currentYear * 12 + currentMonth
}
