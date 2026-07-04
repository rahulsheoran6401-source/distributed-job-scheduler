import { PrismaClient, Queue, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class QueueRepository {
  async create(data: Prisma.QueueUncheckedCreateInput): Promise<Queue> {
    return prisma.queue.create({ data });
  }

  async findById(id: string): Promise<Queue | null> {
    return prisma.queue.findUnique({ where: { id } });
  }

  async findByProject(projectId: string): Promise<Queue[]> {
    return prisma.queue.findMany({ where: { projectId } });
  }

  async update(id: string, data: Prisma.QueueUpdateInput): Promise<Queue> {
    return prisma.queue.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Queue> {
    return prisma.queue.delete({ where: { id } });
  }
}
