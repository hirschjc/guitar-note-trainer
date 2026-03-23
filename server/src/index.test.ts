import request from 'supertest'
import app from './index'

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('API stubs', () => {
  it('POST /api/sessions returns 501', async () => {
    const res = await request(app).post('/api/sessions').send({})
    expect(res.status).toBe(501)
    expect(res.body.code).toBe('NOT_IMPLEMENTED')
  })

  it('GET /api/progress/:deviceId returns 501', async () => {
    const res = await request(app).get('/api/progress/test-device')
    expect(res.status).toBe(501)
  })

  it('POST /api/progress/sync returns 501', async () => {
    const res = await request(app).post('/api/progress/sync').send({})
    expect(res.status).toBe(501)
  })
})
