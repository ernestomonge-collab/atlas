/**
 * Utility to measure and log API endpoint performance
 */

export function measurePerformance(endpoint: string) {
  const start = Date.now()

  return {
    end: () => {
      const duration = Date.now() - start
      const emoji = duration < 100 ? '✅' : duration < 500 ? '⚠️' : '🐢'
      console.log(`${emoji} ${endpoint} - ${duration}ms`)
      return duration
    }
  }
}

export function logSlowQuery(query: string, duration: number) {
  if (duration > 100) {
    console.warn(`🐢 Slow query (${duration}ms): ${query}`)
  }
}
