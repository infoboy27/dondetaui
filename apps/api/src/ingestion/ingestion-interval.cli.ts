import { ingestionIntervalSeconds } from './ingestion-interval'

// Prints the seconds deploy/ingestion-loop*.sh sleeps before the next cycle.
console.log(ingestionIntervalSeconds(process.env))
