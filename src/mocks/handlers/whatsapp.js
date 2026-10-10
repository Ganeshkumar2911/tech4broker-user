import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

export const whatsappHandlers = [
  // WHATSAPP TEMPLATES LIST
  http.get('/api/:role' + (urls?.whatsapp?.templates || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')

    let allTemplates = Array.from({ length: 15 }).map((_, i) => ({
      id: `tpl_${faker.string.numeric(6)}`,
      name: faker.lorem.words(2).replace(/ /g, '_').toLowerCase(),
      category: faker.helpers.arrayElement(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
      language: 'en',
      status: faker.helpers.arrayElement(['APPROVED', 'PENDING', 'REJECTED', 'PAUSED']),
      created_by: faker.person.fullName(),
      waba_phone_number: faker.phone.number(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      header_text: faker.lorem.words(2),
      header_format: 'TEXT',
      body_text: 'Hello {{1}}, welcome to {{2}}.',
      footer_text: faker.company.name()
    }))

    if (status && status !== 'ALL') {
      allTemplates = allTemplates.filter(t => t.status === status)
    }

    if (category && category !== 'ALL') {
      allTemplates = allTemplates.filter(t => t.category === category)
    }

    return HttpResponse.json({
      status: 'success',
      data: allTemplates
    })
  }),

  // WHATSAPP CREATE TEMPLATE
  http.post('/api/:role' + (urls?.whatsapp?.createTemplate || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Template created successfully',
      data: {
        id: `tpl_${faker.string.numeric(6)}`,
        ...body
      }
    })
  }),

  // WHATSAPP DELETE TEMPLATE
  http.delete('/api/:role' + (urls?.whatsapp?.deleteTemplate || '/__UNMATCHED__') + '/:id', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Template deleted successfully'
    })
  })
]
