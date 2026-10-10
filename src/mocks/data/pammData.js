import { faker } from '@faker-js/faker'

// This function generates fresh, recent dummy data every time it's called
export const getLatestWithdrawals = (count = 10) => {
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    user: faker.person.fullName(),
    amount: faker.finance.amount({ min: 100, max: 10000, dec: 2 }),
    status: faker.helpers.arrayElement(['Pending', 'Completed', 'Rejected']),
    // Generate dates from the last 7 days to make it look recent
    date: faker.date.recent({ days: 7 }).toISOString(),
    accountType: faker.helpers.arrayElement(['Standard', 'Premium', 'VIP']),
  }))
}
