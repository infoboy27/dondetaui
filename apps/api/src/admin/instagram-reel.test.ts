import { describe, expect, it } from 'vitest'
import { feedFormat } from './instagram-autopilot'
import { ffmpegArgs, totalSeconds } from './instagram-reel'

describe('ffmpegArgs', () => {
  const scenes = [
    { file: 'a.jpg', seconds: 2.6, zoom: true },
    { file: 'b.jpg', seconds: 1.3, zoom: false },
    { file: 'c.jpg', seconds: 2.8, zoom: true },
  ]

  it('chains crossfades at the right offsets', () => {
    const graph = ffmpegArgs(scenes, 'out.mp4')[ffmpegArgs(scenes, 'out.mp4').indexOf('-filter_complex') + 1]
    expect(graph).toContain('[v0][v1]xfade=transition=fade:duration=0.35:offset=2.25[x1]')
    expect(graph).toContain('[x1][v2]xfade=transition=fade:duration=0.35:offset=3.20[vout]')
    expect(graph).toContain('[0:v]scale=2160:3840,zoompan=')
    expect(graph).toContain('[1:v]scale=1080:1920,setsar=1,scale=out_range=tv')
  })

  it('adds a silent audio track as long as the video', () => {
    const args = ffmpegArgs(scenes, 'out.mp4')
    expect(totalSeconds(scenes)).toBeCloseTo(6)
    expect(args).toContain('anullsrc=channel_layout=stereo:sample_rate=44100')
    expect(args[args.indexOf('anullsrc=channel_layout=stereo:sample_rate=44100') - 2]).toBe('6.00')
    expect(args).toContain('3:a')
    expect(args.at(-1)).toBe('out.mp4')
  })

  it('handles a single scene', () => {
    const args = ffmpegArgs([scenes[0]], 'out.mp4')
    expect(args[args.indexOf('-filter_complex') + 1]).toContain('[v0]null[vout]')
  })
})

describe('feedFormat', () => {
  it('carousel on Sundays, Reels Mon/Wed/Fri, images the rest', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(feedFormat)).toEqual(['carousel', 'reel', 'image', 'reel', 'image', 'reel', 'image'])
  })
})
