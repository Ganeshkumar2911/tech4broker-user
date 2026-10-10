import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

export const ticketsHandlers = [
  // LIST TICKETS
  http.get('/api/:role' + (urls?.tickets?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    const totalItems = 30
    
    const allTickets = Array.from({ length: totalItems }).map((_, i) => ({
      id: i + 1,
      ticket_number: `TKT-${faker.number.int({ min: 1000, max: 9999 })}`,
      priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
      status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
      subject: faker.lorem.sentence(),
      created_by_name: faker.person.fullName(),
      created_by_email: faker.internet.email(),
      created_by_role: 'Client',
      created_at: faker.date.recent({ days: 30 }).toISOString(),
    }))

    return HttpResponse.json({
      status: 'success',
      data: allTickets.slice((page - 1) * perPage, page * perPage),
      pagination: {
        page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / perPage)
      },
      counts: {
        new_tickets: 5,
        open_tickets: 12,
        closed_tickets: 18,
        total_tickets: totalItems
      }
    })
  }),

  // GET TICKET DETAIL
  http.get('/api/:role' + (urls?.tickets?.detail || '/__UNMATCHED__') + '/:id', ({ params }) => {
    return HttpResponse.json({
      status: 'success',
      data: {
        id: params.id,
        ticket_number: `TKT-${faker.number.int({ min: 1000, max: 9999 })}`,
        priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
        status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
        subject: faker.lorem.sentence(),
        created_by_name: faker.person.fullName(),
        created_by_email: faker.internet.email(),
        created_by_role: 'Client',
        created_at: faker.date.recent({ days: 5 }).toISOString(),
        assigned_staff: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: faker.internet.email()
        },
        assigned_role: 'Support Agent',
        description: faker.lorem.paragraphs(2),
        history: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }).map((_, i) => ({
          id: i + 1,
          created_at: faker.date.recent({ days: 3 }).toISOString(),
          event_type: faker.helpers.arrayElement(['comment_added', 'status_changed', 'staff_assigned']),
          actor_name: faker.person.fullName(),
          actor_role: faker.helpers.arrayElement(['Support Agent', 'Admin', 'Client']),
          actor_user_id: faker.string.uuid(),
          comment_text: faker.lorem.sentences(2),
          file_name: faker.datatype.boolean() ? faker.system.fileName() : null,
          file_url: faker.internet.url()
        }))
      }
    })
  }),

  // UPDATE TICKET (Assign, Change Status)
  http.put('/api/:role' + (urls?.tickets?.detail || '/__UNMATCHED__') + '/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Ticket updated successfully',
      data: {
        id: params.id,
        ...body
      }
    })
  }),

  // ADD COMMENT
  http.post('/api/:role' + (urls?.tickets?.addComment || '/__UNMATCHED__'), async ({ request }) => {
    return HttpResponse.json({
      status: 'success',
      message: 'Comment added successfully',
      data: {
        id: faker.number.int({ min: 100, max: 999 }),
        created_at: new Date().toISOString(),
        event_type: 'comment_added',
        actor_name: 'Current User',
        actor_role: 'Admin',
        comment_text: 'Mock comment response',
      }
    })
  })
]
