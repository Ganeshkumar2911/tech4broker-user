import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const paymentRequestsHandlers = [
  http.get('/api/:role' + (urls?.paymentRequests?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 120
    const totalPages = Math.ceil(totalItems / perPage)

    const allRequests = Array.from({ length: totalItems }).map((_, i) => {
      const type = faker.helpers.arrayElement(['deposit', 'withdrawal'])
      const gateway = faker.helpers.arrayElement(['bank_transfer', 'stripe', 'crypto', 'paymaxis'])
      const method = gateway === 'bank_transfer' ? 'bank transaction' : gateway === 'stripe' ? 'credit card' : 'crypto'
      
      const amount = faker.number.float({ min: 100, max: 10000, fractionDigits: 2 })
      const currency = faker.helpers.arrayElement(['USD', 'EUR', 'GBP'])
      const conversionRate = currency !== 'USD' ? faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 4 }) : 1
      const paidAmount = amount * conversionRate

      let rawPayload = null
      if (gateway === 'bank_transfer') {
        rawPayload = JSON.stringify({
          bank: faker.company.name() + ' Bank',
          account_number: faker.finance.accountNumber(),
          ifsc_code: faker.string.alphanumeric(11).toUpperCase(),
          account_name: faker.person.fullName()
        })
      }

      const status = faker.helpers.arrayElement(['pending', 'processing', 'approved', 'rejected'])

      return {
        id: faker.number.int({ min: 100000, max: 999999 }),
        user_name: faker.person.fullName(),
        user_email: faker.internet.email(),
        tags: [
          { id: 1, label: faker.helpers.arrayElement(['VIP', 'New', 'High Volume']), color: faker.helpers.arrayElement(['blue', 'green', 'yellow']) },
          { id: 2, label: faker.helpers.arrayElement(['Verified', 'Unverified']), color: 'gray' }
        ],
        trading_account_number: faker.number.int({ min: 100000, max: 999999 }),
        account_type: faker.helpers.arrayElement(['Standard', 'Pro', 'Raw Spread']),
        broker_currency: 'USD',
        type: type,
        amount: amount,
        currency: currency,
        paid_amount: paidAmount,
        paid_currency: currency,
        conversion_rate: {
          units_per_usd: conversionRate,
          account_currency: 'USD',
          payment_currency: currency
        },
        gateway: gateway,
        method: method,
        acquirer: faker.helpers.arrayElement(['SafeCharge', 'Nuvei', null]),
        address: gateway === 'crypto' ? faker.string.alphanumeric(34) : null,
        txid: faker.helpers.arrayElement([faker.string.alphanumeric(64), null]),
        external_payment_id: faker.string.alphanumeric(16),
        approval_status: status,
        rejection_reason: status === 'rejected' ? faker.lorem.sentence() : null,
        payment_status: status === 'approved' ? 'paid' : status === 'rejected' ? 'failed' : status,
        raw_payload: rawPayload,
        created_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: paginate(allRequests, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages },
      summary: {
        pending_deposits: 45,
        approved_deposits: 120,
        rejected_deposits: 10,
        pending_withdrawals: 30,
        approved_withdrawals: 80,
        rejected_withdrawals: 5
      },
      filters: {
        clients: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, name: faker.person.fullName() })),
        accounts: Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, account_id: i + 1, account_number: faker.number.int({ min: 100000, max: 999999 }) })),
        types: ['deposit', 'withdrawal'],
        gateways: ['bank_transfer', 'stripe', 'crypto']
      }
    })
  }),

  // Add approve handler to mock approval action
  http.post('/api/:role' + (urls?.paymentRequests?.approve || '/__UNMATCHED__'), () => {
    return HttpResponse.json({ status: 'success', message: 'Payment request approved successfully' })
  }),

  // Add reject handler to mock rejection action
  http.post('/api/:role' + (urls?.paymentRequests?.reject || '/__UNMATCHED__'), () => {
    return HttpResponse.json({ status: 'success', message: 'Payment request rejected successfully' })
  })
]
