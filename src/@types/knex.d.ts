declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: UUID
      name: string
      description: string
      date: Date
      isInDiet: boolean
      user_id: UUID
      created_at: Date
      updated_at: Date
    }
    users: {
      id: UUID
      name: string
      email: string
      password: string
      age: number
    }
  }
}
