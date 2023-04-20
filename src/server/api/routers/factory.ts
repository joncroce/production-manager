import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addFactorySchema, changeFactoryNameSchema } from '@/schemas/factory';

export const factoryRouter = createTRPCRouter({
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { id } = input;
			const factory = await ctx.prisma.factory.findUnique({
				where: {
					id
				}
			});

			return factory;
		}),
	add: publicProcedure
		.input(addFactorySchema)
		.mutation(async ({ ctx, input }) => {
			const { name, userId } = input;

			const factory = await ctx.prisma.factory.create({
				data: {
					User: {
						connect: {
							id: userId
						}
					},
					name
				}
			});

			return factory;
		}),
	changeName: publicProcedure
		.input(changeFactoryNameSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, name } = input;

			await ctx.prisma.factory.update({
				where: { id },
				data: { name }
			});
		})
});