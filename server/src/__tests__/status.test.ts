import request from 'supertest';
import app from '../index';

describe('GET /api/status', () => {
  it('should return status running', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'running');
    expect(response.body).toHaveProperty('message', 'Healthy Eats API is operational');
    expect(response.body).toHaveProperty('timestamp');
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  it('should return welcome message on root', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Welcome to Healthy Eats API');
    expect(response.body).toHaveProperty('version', '1.0.0');
  });
});