// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const record = (num: number, title = `Comic ${num}`) => ({
  num, year: 2026, month: 11, day: 3, title, img: `https://imgs.xkcd.com/comics/${num}.png`,
  alt: `Alt text for ${title}`, link: `https://xkcd.com/${num}/`,
})

function setupApp(records = [record(2), record(1, 'First comic')]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/xkcd-index.json') return { ok: true, json: async () => records } as Response
    if (url === '/api/xkcd/rss.xml') return {
      ok: true,
      text: async () => '<rss><channel><item><title>Recent</title><link>https://xkcd.com/3/</link></item></channel></rss>',
    } as Response
    if (url === '/api/xkcd/3/info.0.json') return { ok: true, json: async () => record(3) } as Response
    throw new Error(`Unexpected request ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  return fetchMock
}

describe('comic calendar interaction', () => {
  it('shows the lowest-numbered shared-date comic and switches comics inside a centered dialog', async () => {
    setupApp()
    const preview = await screen.findByRole('button', { name: /expand comic 1: first comic/i })
    expect(preview.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(preview)
    expect(await screen.findByRole('heading', { name: 'First comic' })).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Alt text for First comic' })).not.toBeNull()
    const dialog = screen.getByRole('dialog', { name: 'First comic' })
    expect(dialog.className).toContain('comic-expanded')
    expect(dialog.parentElement?.className).toContain('comic-overlay')
    const imageArea = dialog.querySelector('.comic-image-area')
    expect(imageArea).not.toBeNull()
    expect(imageArea?.querySelector('img')?.className).toContain('full-comic')
    expect(dialog.querySelector('.comic-view-layout')).not.toBeNull()
    const alternatives = screen.getByRole('complementary', { name: 'Other comics published this day' })
    expect(alternatives.querySelector('ul')).not.toBeNull()
    const otherComic = screen.getByRole('link', { name: 'Comic #2: Comic 2' })
    expect(alternatives.contains(otherComic)).toBe(true)
    const selectedComic = screen.getByRole('link', { name: 'Comic #1: First comic' })
    expect(alternatives.contains(selectedComic)).toBe(true)
    expect(selectedComic.getAttribute('aria-current')).toBe('true')
    expect(otherComic.getAttribute('href')).toBe('https://xkcd.com/2/')
    expect(preview.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(otherComic)
    expect(screen.getByRole('heading', { name: 'Comic 2' })).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Alt text for Comic 2' })).not.toBeNull()
    expect(screen.getByRole('dialog', { name: 'Comic 2' })).not.toBeNull()
    const alternativesAfterSwitch = screen.getByRole('complementary', { name: 'Other comics published this day' })
    expect(alternativesAfterSwitch.querySelectorAll('a').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('link', { name: 'Comic #1: First comic' }).getAttribute('aria-current')).toBeNull()
    expect(screen.getByRole('link', { name: 'Comic #2: Comic 2' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByText('Alt text for Comic 2')).not.toBeNull()
    expect(preview.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Close expanded comic' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(preview.getAttribute('aria-expanded')).toBe('false')
  })

  it('reports a failed full comic image while keeping its alt text available', async () => {
    setupApp([record(1, 'First comic')])
    const preview = await screen.findByRole('button', { name: /expand comic 1/i })
    fireEvent.click(preview)
    const image = await screen.findByRole('img', { name: 'Alt text for First comic' })
    fireEvent.error(image)
    expect((await screen.findByRole('status')).textContent).toContain('The comic image could not be loaded.')
    expect(screen.getByText('Alt text for First comic')).not.toBeNull()
  })

  it('opens with the keyboard and dismisses with Escape while exposing its state', async () => {
    const user = userEvent.setup()
    setupApp([record(1, 'First comic')])
    const preview = await screen.findByRole('button', { name: /expand comic 1: first comic/i })
    preview.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'First comic' })).not.toBeNull()
    expect(preview.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: 'Close expanded comic' })).not.toBeNull()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(preview.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows a retryable error when the feed fails instead of showing an empty month', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/xkcd-index.json') return { ok: true, json: async () => [record(1)] } as Response
      if (url === '/api/xkcd/rss.xml') return { ok: false, status: 503 } as Response
      throw new Error(`Unexpected request ${url}`)
    }))
    render(<App />)
    expect(await screen.findByRole('alert')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Retry' })).not.toBeNull()
    expect(screen.queryByRole('grid')).toBeNull()
  })
})
