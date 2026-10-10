import { http, HttpResponse } from 'msw'
import urls from '../../api/urls'
import { faker } from '@faker-js/faker'

function paginate(items, page, perPage) {
  const start = (page - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

export const mediaHandlers = [
  // MEDIA GROUPS LIST
  http.get('/api/:role' + (urls?.media?.groups?.list || '/__UNMATCHED__'), ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 15
    const totalPages = Math.ceil(totalItems / perPage)

    const allGroups = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.number.int({ min: 10, max: 999 }),
      title: faker.helpers.arrayElement(['Promotional Banners', 'Social Media Assets', 'Event Photos', 'Logo Variations', 'Client Presentations']),
      description: faker.lorem.sentence(),
      is_active: faker.datatype.boolean(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      media_groups: paginate(allGroups, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total: totalItems, 
        pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    })
  }),

  // MEDIA GROUPS CREATE
  http.post('/api/:role' + (urls?.media?.groups?.create || '/__UNMATCHED__'), async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Media group created successfully',
      data: {
        id: faker.number.int({ min: 1000, max: 9999 }),
        ...body
      }
    })
  }),

  // MEDIA GROUPS UPDATE
  http.put('/api/update-media-group/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      status: 'success',
      message: 'Media group updated successfully',
      data: body
    })
  }),

  // MEDIA GROUPS DELETE
  http.delete('/api/delete-media-group/:id', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Media group deleted successfully'
    })
  }),

  // MEDIA IMAGES LIST
  http.get('/api/media-images/:groupId', ({ request, params }) => {
    const url = new URL(request.url)
    const groupId = params.groupId || url.searchParams.get('group_id') || 1
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 10
    
    const totalItems = 25
    const totalPages = Math.ceil(totalItems / perPage)

    const group = {
      id: groupId,
      title: 'Mock Media Group',
      description: 'Detailed mock media group for images.',
      is_active: true,
      created_at: new Date().toISOString()
    }

    const allImages = Array.from({ length: totalItems }).map((_, i) => ({
      id: faker.string.uuid(),
      group_id: groupId,
      title: faker.lorem.words(3),
      image_url: faker.image.url({ width: 800, height: 600 }),
      is_active: faker.datatype.boolean(),
      created_at: faker.date.recent().toISOString()
    }))

    return HttpResponse.json({
      status: 'success',
      media_group: group,
      media_images: paginate(allImages, page, perPage),
      pagination: { 
        page, 
        per_page: perPage, 
        total: totalItems, 
        pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    })
  }),

  // MEDIA IMAGES CREATE
  http.post('/api/:role' + (urls?.media?.images?.create || '/__UNMATCHED__'), () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Media image created successfully'
    })
  }),

  // MEDIA IMAGES UPDATE
  http.put('/api/media-images/:imageId', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Media image updated successfully'
    })
  }),

  // MEDIA IMAGES DELETE
  http.delete('/api/media-images/:imageId', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Media image deleted successfully'
    })
  })
]
