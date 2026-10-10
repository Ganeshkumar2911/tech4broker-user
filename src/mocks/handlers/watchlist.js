import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const watchlistHandlers = [
  // WATCHLIST SETTINGS
  http.get('/api/:role' + (urls?.watchlist?.settings || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        max_watchlists_per_user: 10,
        max_symbols_per_watchlist: 100
      }
    })
  }),
  
  http.patch('/api/:role' + (urls?.watchlist?.settings || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Settings updated',
      data: body
    })
  }),

  // WATCHLIST SYMBOLS
  http.get('/api/:role' + (urls?.watchlist?.symbols || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const activeOnly = url.searchParams.get('active_only')

    const totalItems = 45
    const totalPages = Math.ceil(totalItems / perPage)

    const categories = ['Forex', 'Crypto', 'Stocks', 'Indices', 'Commodities']

    let allSymbols = Array.from({ length: totalItems }).map((_, i) => {
      const cat = faker.helpers.arrayElement(categories)
      return {
        id: faker.number.int({ min: 1000, max: 9999 }),
        symbol: faker.finance.currencyCode() + (cat === 'Forex' ? 'USD' : ''),
        name: faker.company.name(),
        category: cat,
        is_active: faker.datatype.boolean(),
        description: faker.lorem.sentence(),
        created_at: faker.date.recent().toISOString()
      }
    })

    if (search) {
      allSymbols = allSymbols.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (category) {
      allSymbols = allSymbols.filter(s => s.category === category)
    }
    if (activeOnly === 'true') {
      allSymbols = allSymbols.filter(s => s.is_active)
    } else if (activeOnly === 'false') {
      allSymbols = allSymbols.filter(s => !s.is_active)
    }

    return HttpResponse.json({
      status: 'success',
      data: {
        categories,
        items: paginate(allSymbols, page, perPage),
        page,
        pages: totalPages,
        per_page: perPage,
        total: allSymbols.length
      }
    })
  }),

  http.post('/api/:role' + (urls?.watchlist?.symbols || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Symbol added successfully',
      data: {
        id: faker.number.int({ min: 10000, max: 99999 }),
        ...body
      }
    })
  }),

  http.put('/api/:role' + (urls?.watchlist?.symbols || '/__UNMATCHED__') + '/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Symbol updated successfully',
      data: body
    })
  }),

  http.delete('/api/:role' + (urls?.watchlist?.symbols || '/__UNMATCHED__') + '/:id', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Symbol deleted successfully'
    })
  }),

  http.post('/api/:role' + (urls?.watchlist?.import || '/__UNMATCHED__'), async () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Import successful',
      data: {
        added: faker.number.int({ min: 10, max: 50 }),
        updated: faker.number.int({ min: 0, max: 20 }),
        skipped: faker.number.int({ min: 0, max: 5 })
      }
    })
  }),

  http.get('/api/:role' + (urls?.watchlist?.template || '/__UNMATCHED__'), () => {
    return HttpResponse.text('symbol,name,category,is_active\nAAPL,Apple Inc,Stocks,true\nBTCUSD,Bitcoin,Crypto,true')
  })
]
