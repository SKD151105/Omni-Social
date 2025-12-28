import request from 'supertest';
import app from '../src/app.js';

describe('Healthcheck', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/healthcheck');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
