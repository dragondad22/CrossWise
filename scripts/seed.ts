#!/usr/bin/env tsx

import { seedSampleData, clearAllData } from '../src/lib/seed-data'

async function main() {
  const action = process.argv[2]
  
  switch (action) {
    case 'seed':
      console.log('🌱 Seeding sample data...')
      await seedSampleData()
      break
    case 'clear':
      console.log('🗑️  Clearing all data...')
      await clearAllData()
      break
    case 'reset':
      console.log('🔄 Resetting database...')
      await clearAllData()
      await seedSampleData()
      break
    default:
      console.log('Usage:')
      console.log('  npm run seed        - Add sample data')
      console.log('  npm run seed clear  - Clear all data')
      console.log('  npm run seed reset  - Clear and re-seed')
      break
  }
  
  process.exit(0)
}

main().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})