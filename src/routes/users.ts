import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import crypto, { randomUUID } from 'node:crypto'
import { z } from 'zod'
import bcrypt from 'bcrypt'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/create', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      age: z.number(),
      password: z.string(),
    })
    const body = createUserBodySchema.parse(request.body)
    const { email, name, age, password } = body
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)

    await knex('users').insert({
      id: crypto.randomUUID(),
      email,
      name,
      age,
      password: hash,
    })

    return reply.status(201).send({
      messege: 'User criado com sucesso',
    })
  })

  app.post('/login', async (request, reply) => {
    const loginUserBodySchema = z.object({
      email: z.string(),
      password: z.string(),
    })
    const body = loginUserBodySchema.parse(request.body)

    const { email, password } = body
    try {
      // Busca o usuário pelo email
      const usuario = await knex('users').where({ email }).first()
      const userId = usuario?.id

      if (!usuario) {
        console.log('Usuário não encontrado')
        return false
      }

      const senhaValida = await bcrypt.compare(password, usuario.password)

      if (senhaValida) {
        const session = randomUUID()

        const token = JSON.stringify({ session, userId })

        reply.cookie('token', token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 dias
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })

        console.log('Login bem-sucedido')
        return reply.status(201).send({
          messege: 'Login bem-sucedido',
        })
      } else {
        console.log('Senha incorreta')
        return 'Senha incorreta'
      }
    } catch (error) {
      console.error('Erro ao validar usuário:', error)
      return false
    }
  })
}
