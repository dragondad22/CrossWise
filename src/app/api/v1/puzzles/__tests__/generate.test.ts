import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../generate/route'

describe('/api/v1/puzzles/generate auth enforcement', () => {
  it('returns 401 when no session cookie is present', async () => {
    const request = new NextRequest('http://localhost/api/v1/puzzles/generate', {
      method: 'POST',
      body: JSON.stringify({ listId: 'clist1234567890123456789' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
