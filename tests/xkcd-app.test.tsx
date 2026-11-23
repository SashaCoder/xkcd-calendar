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
  it('shows the lowest-numbered shared-date comic and links to the others when expanded', async () => {
    setupApp()
    const preview = await screen.findByRole('button', { name: /expand comic 1: first comic/i })
    expect(preview.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(preview)
    expect(await screen.findByRole('heading', { name: 'First comic' })).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Alt text for First comic' })).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Comic #2: Comic 2' }).getAttribute('href')).toBe('https://xkcd.com/2/')
    expect(preview.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(preview)
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'First comic' })).toBeNull())
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

  it('can expand and collapse a comic with the keyboard and exposes its state to assistive technology', async () => {
    const user = userEvent.setup()
    setupApp([record(1, 'First comic')])
    const preview = await screen.findByRole('button', { name: /expand comic 1: first comic/i })
    preview.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'First comic' })).not.toBeNull()
    expect(document.activeElement).toBe(preview)
    expect(preview.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard(' ')
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'First comic' })).toBeNull())
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
