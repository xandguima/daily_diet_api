import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { usersRoutes } from './routes/users'
import { mealsRoutes } from './routes/meals'
import cors from '@fastify/cors'

export const app = fastify()

app.register(cookie)

app.register(cors, {
  origin: '*',
  credentials: true,
})

app.register(usersRoutes, {
  prefix: 'users',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})
