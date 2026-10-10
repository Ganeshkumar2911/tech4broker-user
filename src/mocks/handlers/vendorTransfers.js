import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const vendorTransfersHandlers = [
  http.get('/api/:role' + (urls?.vendor?.transfers || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const typeFilter = url.searchParams.get('type')
    const statusFilter = url.searchParams.get('status')
    
    const totalItems = 50
    const totalPages = Math.ceil(totalItems / perPage)

    let allTransfers = Array.from({ length: totalItems }).map((_, i) => {
      const isDeposit = faker.datatype.boolean()
      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        status: faker.helpers.arrayElement(['assigned', 'completed', 'cancelled']),
        vendor_note: faker.lorem.sentence(),
        assigned_to: faker.person.fullName(),
        assigned_by: faker.person.fullName(),
        proof_image: faker.datatype.boolean() ? faker.image.url() : null,
        utr: faker.datatype.boolean() ? faker.string.alphanumeric(12).toUpperCase() : null,
        payment_request: {
          id: faker.number.int({ min: 10000, max: 99999 }),
          reference_id: faker.string.uuid(),
          approval_status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
          user_name: faker.person.fullName(),
          user_id: faker.number.int({ min: 100, max: 999 }),
          user_email: faker.internet.email(),
          trading_account_number: faker.datatype.boolean() ? faker.finance.accountNumber(6) : null,
          ib_wallet_id: faker.datatype.boolean() ? faker.number.int({ min: 100, max: 999 }) : null,
          fm_wallet_id: faker.datatype.boolean() ? faker.number.int({ min: 100, max: 999 }) : null,
          method: faker.helpers.arrayElement(['crypto', 'wire', 'card']),
          gateway: faker.helpers.arrayElement(['binance', 'stripe', 'manual']),
          type: isDeposit ? 'deposit' : 'withdrawal',
          amount: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
          currency: 'USD',
          paid_amount: faker.number.float({ min: 4000, max: 400000, fractionDigits: 2 }),
          paid_currency: 'INR',
          bank: isDeposit ? {
            company_bank: {
              bank_name: faker.company.name() + ' Bank',
              account_number: faker.finance.accountNumber(10)
            }
          } : {
            bank: faker.company.name() + ' Bank',
            account_name: faker.person.fullName(),
            account_number: faker.finance.accountNumber(12),
            bank_branch_code: faker.finance.bic()
          },
          created_at: faker.date.recent().toISOString(),
          updated_at: faker.date.recent().toISOString()
        },
        created_at: faker.date.recent().toISOString(),
        updated_at: faker.date.recent().toISOString()
      }
    })

    if (typeFilter && typeFilter !== 'all') {
      allTransfers = allTransfers.filter(t => t.payment_request.type === typeFilter)
    }

    if (statusFilter && statusFilter !== 'all') {
      allTransfers = allTransfers.filter(t => t.status === statusFilter)
    }

    return HttpResponse.json({
      status: 'success',
      data: paginate(allTransfers, page, perPage),
      pagination: { page, per_page: perPage, total_items: allTransfers.length, total_pages: Math.ceil(allTransfers.length / perPage) }
    })
  })
]
