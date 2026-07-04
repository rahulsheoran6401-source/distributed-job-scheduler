import { PrismaClient, Project, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectRepository {
  async create(data: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
    return prisma.project.create({ data });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({ where: { id } });
  }

  async findByOrganization(organizationId: string): Promise<Project[]> {
    return prisma.project.findMany({ where: { organizationId, isArchived: false } });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return prisma.project.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Project> {
    return prisma.project.update({ where: { id }, data: { isArchived: true } });
  }
}
