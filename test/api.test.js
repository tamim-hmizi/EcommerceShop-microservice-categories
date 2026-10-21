import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { useDatabase } from './helpers.js';


const base = '/api/categories';
const shoes = { name: 'Shoes', description: 'Running and walking shoes' };

describe('categories service', () => {
  useDatabase();

  it('creates, reads, updates and deletes a category', async () => {
    const created = await request(app).post(base).send(shoes).expect(201);
    const id = created.body._id;

    const list = await request(app).get(base).expect(200);
    assert.equal(list.body.length, 1);

    await request(app).get(`${base}/${id}`).expect(200);

    const updated = await request(app).put(`${base}/${id}`).send({ name: 'Sneakers' }).expect(200);
    assert.equal(updated.body.name, 'Sneakers');
    assert.equal(updated.body.description, shoes.description);

    await request(app).delete(`${base}/${id}`).expect(200);
    await request(app).get(`${base}/${id}`).expect(404);
  });

  it('validates input', async () => {
    await request(app).post(base).send({ name: 'X', description: 'too short' }).expect(400);
    await request(app).post(base).send({ name: 'Bags' }).expect(400);
  });

  it('rejects duplicate names', async () => {
    await request(app).post(base).send(shoes).expect(201);
    await request(app).post(base).send(shoes).expect(400);
  });

  it('exposes Prometheus metrics', async () => {
    const res = await request(app).get(`${base}/metrics`).expect(200);
    assert.match(res.text, /http_request_duration/);
  });
});
