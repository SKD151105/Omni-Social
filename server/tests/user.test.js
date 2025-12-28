import request from 'supertest';
import app from '../src/app.js';

describe('User API', () => {
  it('should return 400 for missing registration fields', async () => {
    const res = await request(app).post('/api/v1/user/register').send({});
    expect(res.statusCode).toBe(400);
  });
});
