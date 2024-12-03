import { expect, it, describe, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})
beforeEach(() => {
  execSync('npm run knex migrate:rollback --all')
  execSync('npm run knex migrate:latest')
})
describe('Users', () => {
  it('should be able to create a user', async () => {
    const response = await request(app.server).post('/users/create').send({
      name: 'John Doe',
      email: 'x5Z7S@example.com',
      age: 30,
      password: '123456',
    })

    expect(response.statusCode).toEqual(201)
  })

  it('should be able to login', async () => {
    await request(app.server).post('/users/create').send({
      name: 'John Doe',
      email: 'x5Z7S@example.com',
      age: 30,
      password: '123456',
    })

    const response = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })
    const cookies = response.headers['set-cookie']

    expect(response.statusCode).toEqual(200)
    expect(cookies).toBeDefined()
  })
  it('should not be able to login with wrong password', async () => {
    await request(app.server).post('/users/create').send({
      name: 'John Doe',
      email: 'x5Z7S@example.com',
      age: 30,
      password: '123456',
    })

    const response = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: 'wrong-password',
    })

    expect(response.statusCode).toEqual(401)
    expect(response.body).toEqual({ messege: 'Usuário ou senha incorretos' })
  })
  it('should not be able to login with wrong email', async () => {
    await request(app.server).post('/users/create').send({
      name: 'John Doe',
      email: 'x5Z7S@example.com',
      age: 30,
      password: '123456',
    })

    const response = await request(app.server).post('/users/login').send({
      email: 'wrong-email@example.com',
      password: '123456',
    })

    expect(response.statusCode).toEqual(401)
    expect(response.body).toEqual({ messege: 'Usuário ou senha incorretos' })
  })
})

describe('Meals', () => {
  beforeAll(async () => {
    await app.ready()
  })
  it('should be able to create a meal', async () => {
    const responseCreate = await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'x5Z7S@example.com',
        age: 30,
        password: '123456',
      })

    expect(responseCreate.statusCode).toEqual(201)

    // console.log('responseCreate = ', responseCreate)
    const responseLogin = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })

    expect(responseLogin.statusCode).toEqual(200)

    const cookies = responseLogin.headers['set-cookie']

    const response = await request(app.server)
      .post('/meals/create')
      .set('Cookie', cookies)
      .send({
        name: 'Banana',
        description: 'Banana',
        date: '2023-04-04',
        isInDiet: true,
      })
    expect(response.statusCode).toEqual(201)
    expect(response.body).toHaveProperty('messege')
  })
  it('should be able to list all meals', async () => {
    const responseCreate = await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'x5Z7S@example.com',
        age: 30,
        password: '123456',
      })

    expect(responseCreate.statusCode).toEqual(201)

    const responseLogin = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })

    expect(responseLogin.statusCode).toEqual(200)

    const cookies = responseLogin.headers['set-cookie']

    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toHaveProperty('meals')
  })

  it('should be able show a specific meal', async () => {
    const responseCreate = await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'x5Z7S@example.com',
        age: 30,
        password: '123456',
      })

    expect(responseCreate.statusCode).toEqual(201)

    const responseLogin = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })

    expect(responseLogin.statusCode).toEqual(200)

    const cookies = responseLogin.headers['set-cookie']

    const response = await request(app.server)
      .post('/meals/create')
      .set('Cookie', cookies)
      .send({
        name: 'Banana',
        description: 'Banana',
        date: '2023-04-04',
        isInDiet: true,
      })

    const responseShow = await request(app.server)
      .get(`/meals/${response.body.id}`)
      .set('Cookie', cookies)
    expect(responseShow.statusCode).toEqual(200)
    expect(responseShow.body).toHaveProperty('meal')
  })

  it('should be able to delete a meal', async () => {
    const responseCreate = await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'x5Z7S@example.com',
        age: 30,
        password: '123456',
      })

    expect(responseCreate.statusCode).toEqual(201)

    const responseLogin = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })

    expect(responseLogin.statusCode).toEqual(200)

    const cookies = responseLogin.headers['set-cookie']

    const response = await request(app.server)
      .post('/meals/create')
      .set('Cookie', cookies)
      .send({
        name: 'Banana',
        description: 'Banana',
        date: '2023-04-04',
        isInDiet: true,
      })
    console.log('response = ', response.body)
    const responseDelete = await request(app.server)
      .delete(`/meals/${response.body.id}`)
      .set('Cookie', cookies)
    expect(responseDelete.statusCode).toEqual(200)
    expect(responseDelete.body).toHaveProperty('messege')
  })
  it('should be able to update a meal', async () => {
    const responseCreate = await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'x5Z7S@example.com',
        age: 30,
        password: '123456',
      })

    expect(responseCreate.statusCode).toEqual(201)

    const responseLogin = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })

    expect(responseLogin.statusCode).toEqual(200)

    const cookies = responseLogin.headers['set-cookie']

    const response = await request(app.server)
      .post('/meals/create')
      .set('Cookie', cookies)
      .send({
        name: 'Banana',
        description: 'Banana',
        date: '2023-04-04',
        isInDiet: true,
      })
    console.log('response = ', response.body)
    const responseUpdate = await request(app.server)
      .put(`/meals/${response.body.id}`)
      .set('Cookie', cookies)
      .send({
        name: 'Banana',
        description: 'Banana',
        date: '2023-04-04',
        isInDiet: true,
      })
    expect(responseUpdate.statusCode).toEqual(200)
    expect(responseUpdate.body).toHaveProperty('messege')
  })
  it('should be able to metrics', async () => {
    const responseCreate = await request(app.server)
      .post('/users/create')
      .send({
        name: 'John Doe',
        email: 'x5Z7S@example.com',
        age: 30,
        password: '123456',
      })

    expect(responseCreate.statusCode).toEqual(201)

    const responseLogin = await request(app.server).post('/users/login').send({
      email: 'x5Z7S@example.com',
      password: '123456',
    })

    expect(responseLogin.statusCode).toEqual(200)

    const cookies = responseLogin.headers['set-cookie']

    const response = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies)
    console.log('response = ', response.body)
    expect(response.statusCode).toEqual(200)
    expect(response.body).toHaveProperty('amountMeals')
    expect(response.body).toHaveProperty('amountMealsInDiet')
    expect(response.body).toHaveProperty('amountMealsOutDiet')
    expect(response.body).toHaveProperty('betterSequence')
  })
})
