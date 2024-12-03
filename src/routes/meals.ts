import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkTokenExists } from '../middleware/check-token-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/create',
    {
      preHandler: checkTokenExists,
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.string(),
        isInDiet: z.boolean(),
      })

      const { token } = request.cookies

      const { userId } = JSON.parse(token as string)
      const body = createMealBodySchema.parse(request.body)
      const { name, description, date, isInDiet } = body
      const parsedDate = new Date(date)

      if (isNaN(parsedDate.getTime())) {
        return reply.status(400).send({ error: 'Invalid date format' })
      }

      const [{ id }] = await knex('meals')
        .insert({
          id: crypto.randomUUID(),
          name,
          description,
          date: parsedDate.toISOString(),
          isInDiet,
          user_id: userId,
        })
        .returning('id')
      reply.status(201).send({
        messege: 'Refeição criada com sucesso',
        id,
      })
    },
  )
  app.get(
    '',
    {
      preHandler: checkTokenExists,
    },
    async (request, reply) => {
      const { token } = request.cookies
      const { userId } = JSON.parse(token as string)
      const meals = await knex('meals').where({
        user_id: userId,
      })
      reply.status(200).send({ meals })
    },
  )
  app.get(
    '/:id',
    {
      preHandler: checkTokenExists,
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const params = getMealParamsSchema.parse(request.params)
      const { id } = params

      const { token } = request.cookies
      const { userId } = JSON.parse(token as string)
      const meal = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Refeição não encontrada' })
      }
      reply.status(200).send({ meal })
    },
  )
  app.put(
    '/:id',
    {
      preHandler: checkTokenExists,
    },
    async (request, reply) => {
      const putMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const putMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        isInDiet: z.boolean().optional(),
      })
      const { name, description, date, isInDiet } = putMealBodySchema.parse(
        request.body,
      )

      const { id } = putMealParamsSchema.parse(request.params)

      const { token } = request.cookies
      const { userId } = JSON.parse(token as string)
      const meal = await knex('meals')
        .where({
          id,
          user_id: userId,
        })
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Refeição não encontrada' })
      }
      try {
        await knex('meals')
          .update({
            name: name ?? meal.name,
            description: description ?? meal.description,
            date: date ?? meal.date,
            isInDiet: isInDiet ?? isInDiet,
          })
          .where({
            id,
            user_id: userId,
          })

        reply.status(200).send({ messege: 'Refeição atualizada com sucesso' })
      } catch (error) {
        console.log('Erro ao atualizar refeição: ', error)
        reply.status(500).send({ error: 'Internal server error' })
      }
    },
  )
  app.delete('/:id', async (request, reply) => {
    const deleteMealParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = deleteMealParamsSchema.parse(request.params)
    try {
      await knex('meals').where({ id }).delete()
      reply.status(200).send({ messege: 'Refeição deletada com sucesso' })
    } catch (error) {
      console.log('Erro ao deletar refeição: ', error)
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
  app.get(
    '/metrics',
    { preHandler: checkTokenExists },
    async (request, reply) => {
      const { token } = request.cookies
      const { userId } = JSON.parse(token as string)
      try {
        const meals = await knex('meals').where({
          user_id: userId,
        })
        meals.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        const amountMeals = meals.length
        const mealsInDiet = meals.filter((meal) => meal.isInDiet === 1)
        const amountMealsInDiet = mealsInDiet.length
        const amountMealsOutDiet = amountMeals - amountMealsInDiet

        let betterSequence = 0
        let currentSequence = 0

        for (let i = 0; i < meals.length; i++) {
          if (meals[i].isInDiet) {
            currentSequence++
            betterSequence = Math.max(betterSequence, currentSequence)
          } else {
            currentSequence = 0
          }
        }

        reply.status(200).send({
          amountMeals,
          amountMealsInDiet,
          amountMealsOutDiet,
          betterSequence,
        })
      } catch (error) {
        console.log('Erro ao buscar refeições: ', error)
        reply.status(500).send({ error: 'Internal server error' })
      }
    },
  )
}
