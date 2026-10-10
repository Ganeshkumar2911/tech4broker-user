import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const paymentHandlers = [
  // PAYMENT METHODS LIST
  http.get('/api/:role' + (urls?.paymentMethods?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 35
    const totalPages = Math.ceil(totalItems / perPage)

    const allMethods = Array.from({ length: totalItems }).map((_, i) => {
      const gateway = faker.helpers.arrayElement(['STRIPE', 'PAYPAL', 'BINANCE_PAY', 'MANUAL_WIRE', 'COINBASE'])
      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        gateway: gateway,
        method_type: faker.helpers.arrayElement(['crypto', 'credit_card', 'bank_transfer', 'e_wallet']),
        payment_method_code: faker.string.alphanumeric(8).toUpperCase(),
        wallet_label: `${gateway} - ${faker.helpers.arrayElement(['USD', 'EUR', 'GBP'])}`,
        remarks: faker.lorem.words(3),
        is_active: faker.datatype.boolean(),
        enable_deposit: faker.datatype.boolean(),
        disable_client_deposit: false,
        enable_withdrawal: faker.datatype.boolean(),
        disable_client_withdrawal: false,
        created_at: faker.date.recent().toISOString(),
        updated_at: faker.date.recent().toISOString()
      }
    })

    return HttpResponse.json({
      status: 'success',
      data: paginate(allMethods, page, perPage),
      pagination: { page, per_page: perPage, total_items: totalItems, total_pages: totalPages }
    })
  }),

  // PAYMENT METHOD CREATE
  http.post('/api/:role' + (urls?.paymentMethods?.create || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Payment method created successfully',
      data: {
        id: faker.number.int({ min: 10000, max: 99999 }),
        ...body
      }
    })
  }),

  // PAYMENT METHOD UPDATE
  http.patch('/api/:role' + (urls?.paymentMethods?.update || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Payment method updated successfully',
      data: {
        ...body
      }
    })
  }),
  
  // SYNC WALLETS
  http.post('/api/:role' + (urls?.paymentMethods?.syncWallets || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Wallets synced successfully'
    })
  })
]
