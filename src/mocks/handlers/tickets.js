import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

export const ticketsHandlers = [
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
