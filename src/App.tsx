import { useEffect, useMemo, useState } from 'react'
import {
  createComicRepository,
  fetchComic,
  fetchComicIndex,
  fetchFeed,
  getComicYears,
  type XkcdComic,
} from './lib/xkcd'
import { adjacentMonth, isWithinCalendarBounds, makeCalendarDays } from './lib/calendar'

const fetchRuntimeFeed = import.meta.env.DEV ? fetchFeed : async () => []

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

export default function App() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [comics, setComics] = useState<XkcdComic[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [repository, setRepository] = useState<ReturnType<typeof createComicRepository> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchComicIndex().then((records) => {
      if (cancelled) return
      const repo = createComicRepository({ initialRecords: records, fetchFeed: fetchRuntimeFeed, fetchComic })
      setRepository(repo)
      setAvailableYears(getComicYears(records, currentYear))
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load the XKCD archive.')
    })
    return () => { cancelled = true }
  }, [currentYear])

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    setLoading(true)
    setError('')
    repository.getMonth(year, month).then((records) => {
      if (cancelled) return
      setComics(records)
      setAvailableYears(getComicYears(repository.getSnapshot(), currentYear))
      setLoading(false)
    }).catch((cause: unknown) => {
      if (!cancelled) {
        setError(cause instanceof Error ? cause.message : 'Unable to load XKCD comics.')
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [repository, year, month, currentYear])

  const days = useMemo(() => makeCalendarDays(year, month, comics), [year, month, comics])
  const expandedComic = useMemo(() => days.flatMap((day) => day.comics).find((comic) => comic.num === expanded), [days, expanded])
  const expandedDay = useMemo(() => days.find((day) => day.comics.some((comic) => comic.num === expanded)), [days, expanded])
  const firstYear = availableYears[0] ?? currentYear
  const canGoPrevious = isWithinCalendarBounds(year - (month === 1 ? 1 : 0), month === 1 ? 12 : month - 1, firstYear, currentYear, currentMonth)
  const canGoNext = isWithinCalendarBounds(year + (month === 12 ? 1 : 0), month === 12 ? 1 : month + 1, firstYear, currentYear, currentMonth)

  function moveMonth(delta: -1 | 1) {
    const next = adjacentMonth(year, month, delta)
    setYear(next.year)
    setMonth(next.month)
    setExpanded(null)
  }

  function retry() {
    if (!repository) {
      setError('')
      setLoading(true)
      fetchComicIndex().then((records) => {
        const repo = createComicRepository({ initialRecords: records, fetchFeed: fetchRuntimeFeed, fetchComic })
        setRepository(repo)
        setAvailableYears(getComicYears(records, currentYear))
      }).catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to load the XKCD archive.')
        setLoading(false)
      })
      return
    }
    repository.clearFeedCache()
    setRepository({ ...repository } as ReturnType<typeof createComicRepository>)
  }

  function closeExpanded() {
    setExpanded(null)
    setImageFailed(false)
  }

  useEffect(() => {
    if (expanded === null) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeExpanded()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expanded])

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="XKCD Calendar home">
          <span className="wordmark-mark" aria-hidden="true">xkcd</span><span>calendar</span>
        </a>
        <p className="header-note">A little comic for every day it exists.</p>
      </header>
      <section className="calendar-panel" aria-labelledby="calendar-title">
        <div className="calendar-heading">
          <div><p className="eyebrow">THE ARCHIVE, DAY BY DAY</p><h1 id="calendar-title">XKCD Calendar</h1></div>
          <div className="month-controls" aria-label="Calendar navigation">
            <button className="nav-button" type="button" onClick={() => moveMonth(-1)} disabled={!canGoPrevious} aria-label="Previous month">←</button>
            <div className="month-selectors">
              <span className="month-name" aria-live="polite">{monthLabel(year, month)}</span>
              <label className="sr-only" htmlFor="year-select">Calendar year</label>
              <select id="year-select" value={year} onChange={(event) => { setYear(Number(event.target.value)); setExpanded(null) }} aria-label="Select year">
                {availableYears.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
              </select>
            </div>
            <button className="nav-button" type="button" onClick={() => moveMonth(1)} disabled={!canGoNext} aria-label="Next month">→</button>
          </div>
        </div>
        {error && <div role="alert" className="error-state"><p>Comics could not be loaded: {error}</p><button type="button" onClick={retry}>Retry</button></div>}
        {!error && loading && <p className="status-state" role="status">Loading comics…</p>}
        {!error && !loading && <div className="calendar-grid" role="grid" aria-label={monthLabel(year, month)}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className="weekday" role="columnheader" key={day}>{day}</div>)}
          {days.map((day, index) => day.date === 0
            ? <div className="day-cell blank-day" role="gridcell" aria-hidden="true" key={`blank-${index}`} />
            : <div className={`day-cell${day.comics.length ? ' has-comic' : ''}`} role="gridcell" aria-label={`${monthLabel(year, month).split(' ')[0]} ${day.date}${day.comics.length ? `, ${day.comics.length} comic${day.comics.length === 1 ? '' : 's'}` : ', no comic'}`} key={day.date}>
                <span className="date-number">{day.date}</span>
                {day.comics.length > 0 && <button className="comic-preview" type="button" onClick={() => { setExpanded(day.comics.some((comic) => comic.num === expanded) ? null : day.comics[0].num); setImageFailed(false) }} aria-expanded={day.comics.some((comic) => comic.num === expanded)} aria-label={`${day.comics.some((comic) => comic.num === expanded) ? 'Collapse' : 'Expand'} comic ${day.comics[0].num}: ${day.comics[0].title}`}>
                  <img src={day.comics[0].img} alt="" loading="lazy" />
                  <span>{day.comics[0].title}</span>
                </button>}
                {day.comics.length > 1 && <span className="more-comics">+{day.comics.length - 1} more</span>}
              </div>)}
        </div>}
      </section>
      {expandedComic && <div className="comic-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeExpanded() }}>
        <section className="comic-expanded" role="dialog" aria-modal="true" aria-labelledby="expanded-comic-title">
          <button className="comic-close" type="button" onClick={closeExpanded} aria-label="Close expanded comic">Close</button>
          <h2 id="expanded-comic-title">{expandedComic.title}</h2>
          <div className="comic-view-layout">
            <div className="comic-image-area">
              {!imageFailed
                ? <img className="full-comic" src={expandedComic.img} alt={expandedComic.alt} onError={() => setImageFailed(true)} />
                : <p role="status" className="image-error">The comic image could not be loaded.</p>}
              <p className="comic-alt">{expandedComic.alt}</p>
            </div>
            {expandedDay && expandedDay.comics.length > 1 && <aside className="comic-alternatives" aria-label="Other comics published this day">
              <h3>Also published this day</h3>
              <ul>{expandedDay.comics.map((other) => <li key={other.num}><a href={other.link} aria-current={other.num === expandedComic.num ? 'true' : undefined} onClick={(event) => { event.preventDefault(); setExpanded(other.num); setImageFailed(false) }}>Comic #{other.num}: {other.title}</a></li>)}</ul>
            </aside>}
          </div>
        </section>
      </div>}
      <footer className="site-footer">Comics by Randall Munroe · <a href="https://xkcd.com/">xkcd.com</a></footer>
    </main>
  )
}
