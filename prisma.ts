import { PrismaClient } from '@prisma/client'

function extendClient(client: PrismaClient) {
  return client
}

const prisma = extendClient(new PrismaClient({}))

export default prisma
