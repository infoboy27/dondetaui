import { describe, expect, it } from 'vitest'
import { breakdown, byFormat, mediaFormat, series, totals, type PostStats } from './instagram-insights'

describe('mediaFormat', () => {
  it('maps the API media types to our formats', () => {
    expect(mediaFormat({ media_type: 'VIDEO', media_product_type: 'REELS' })).toBe('reel')
    expect(mediaFormat({ media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED' })).toBe('carousel')
    expect(mediaFormat({ media_type: 'IMAGE', media_product_type: 'FEED' })).toBe('image')
  })
})

describe('totals', () => {
  it('reads total values and the follow/unfollow breakdown', () => {
    const period = totals(
      [{ name: 'reach', total_value: { value: 13 } }, { name: 'views', total_value: { value: 109 } }],
      [{ name: 'follows_and_unfollows', total_value: { breakdowns: [{ results: [{ dimension_values: ['FOLLOWER'], value: 5 }, { dimension_values: ['NON_FOLLOWER'], value: 2 }] }] } }],
    )
    expect(period).toMatchObject({ reach: 13, views: 109, engaged: 0, follows: 5, unfollows: 2 })
  })

  it('leaves follows unknown when Instagram did not answer', () => {
    expect(totals([]).follows).toBeNull()
  })
})

describe('series', () => {
  it('dates each point by the day it measures', () => {
    expect(series([{ name: 'reach', values: [{ value: 4, end_time: '2026-10-11T07:00:00+0000' }] }])).toEqual([{ date: '2026-10-10', value: 4 }])
  })
})

describe('breakdown', () => {
  it('sorts and labels', () => {
    const rows = breakdown([{ name: 'x', total_value: { breakdowns: [{ results: [{ dimension_values: ['F'], value: 74 }, { dimension_values: ['M'], value: 259 }] }] } }], 8, k => (k === 'M' ? 'Hombres' : 'Mujeres'))
    expect(rows).toEqual([{ label: 'Hombres', value: 259 }, { label: 'Mujeres', value: 74 }])
  })
})

describe('byFormat', () => {
  const post = (format: PostStats['format'], reach: number): PostStats => ({
    id: String(reach), permalink: null, timestamp: '', format, title: '', source: null, reach, views: reach * 2, likes: 0, comments: 0, saved: 0, shares: 0, interactions: 1,
  })

  it('averages per format, Reels first, skipping empty formats', () => {
    expect(byFormat([post('image', 10), post('image', 20), post('reel', 300)])).toEqual([
      { format: 'reel', posts: 1, avgReach: 300, avgViews: 600, avgInteractions: 1 },
      { format: 'image', posts: 2, avgReach: 15, avgViews: 30, avgInteractions: 1 },
    ])
  })
})
