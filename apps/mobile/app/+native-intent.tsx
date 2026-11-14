import { appPathFor } from '../src/domain/deepLinks'

// Universal links / App Links (https://dondeta.com.do/...) and the dondeta://
// scheme land here first: web paths that differ from app routes are mapped
// (src/domain/deepLinks.ts), anything unknown opens Home.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return appPathFor(path)
  } catch {
    return '/'
  }
}
