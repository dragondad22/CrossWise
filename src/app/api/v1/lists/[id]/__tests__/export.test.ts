import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '../export/route'

describe('/api/v1/lists/:id/export auth enforcement', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost/api/v1/lists/clist123/export')

    const response = await GET(request, { params: Promise.resolve({ id: 'clist123' }) })
    expect(response.status).toBe(401)
  })
})
