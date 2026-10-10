import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import urls from '../../api/urls'

import { mockPermissions } from '../data/permissionsData'

export const authHandlers = [
  // 1. Mock Login API
  http.post('/api/:role' + (urls?.auth?.login || '/__UNMATCHED__'), async ({ request }) => {
    console.log("Mock Login triggered!", request.url);
    const body = await request.json()
    const { email, password } = body
    console.log("Login Payload:", email, password);

    const cleanEmail = email?.trim()?.toLowerCase() || ''
    const cleanPassword = password?.trim() || ''

    const isClient = cleanEmail === 'client@tech4broker.com' && cleanPassword === 'Client@123'
    const isFm = cleanEmail === 'fm@tech4broker.com' && cleanPassword === 'Fundmanager@123'

    if (!isClient && !isFm) {
      console.log("Login failed: invalid credentials", cleanEmail, cleanPassword);
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: "Invalid email or password."
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const role = isClient ? 'client' : 'fm'
    console.log("Login successful! Role:", role);

    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'dummy-jwt-token-ey123456789',
        role: role,
        user: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          email: email,
          role: role,
          avatar: faker.image.avatar()
        }
      },
      message: "Login successful"
    })
  }),

  // 2. Mock Logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true, message: "Logged out successfully" })
  }),

  http.get('/api/:role' + (urls?.auth?.profile || '/__UNMATCHED__'), ({ request, params }) => {
    // Check if the frontend sent the token in the headers
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return new HttpResponse(null, { status: 401 }) // Unauthorized
    }

    const currentRole = params.role || 'client'

    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-123',
        name: currentRole === 'fm' ? 'Fund Manager' : 'Client User',
        email: currentRole === 'fm' ? 'fm@tech4broker.com' : 'client@tech4broker.com',
        role: currentRole,
        is_ib: currentRole === 'client' ? 0 : 0,
        phone_number: faker.phone.number(),
        date_of_birth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        country: 'US',
        state: faker.location.state(),
        city: faker.location.city(),
        address: faker.location.streetAddress(),
        zip_code: faker.location.zipCode(),
        created_at: faker.date.past({ years: 2 }).toISOString().split('T')[0]
      }
    })
  }),

  // 4. Mock Update Profile
  http.put('/api/:role' + (urls?.auth?.updateProfile || '/update-profile') + '/:id', async ({ request }) => {
    return HttpResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  })
]
