import { useEffect, useState } from 'react'

// Seconds left before a code can be requested again (the API allows one per
// minute). `start()` restarts it.
export function useCountdown(seconds = 60, startRunning = false) {
  const [left, setLeft] = useState(startRunning ? seconds : 0)

  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft(value => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  return { left, start: () => setLeft(seconds) }
}
