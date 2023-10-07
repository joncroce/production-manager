import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addFactorySchema, changeFactoryNameSchema, deleteFactorySchema } from '@/schemas/factory';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

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
		}),
	delete: publicProcedure
		.input(deleteFactorySchema)
		.mutation(async ({ ctx, input }) => {
			const { factoryId } = input;
			const args = { where: { factoryId } };
			await ctx.prisma.salesOrder.deleteMany(args);
			await ctx.prisma.salesOrderItem.deleteMany(args);
			await ctx.prisma.blend.deleteMany(args);
			await ctx.prisma.blendComponent.deleteMany(args);
			await ctx.prisma.formula.deleteMany(args);
			await ctx.prisma.formulaComponent.deleteMany(args);
			await ctx.prisma.tank.deleteMany(args);
			await ctx.prisma.product.deleteMany(args);
			await ctx.prisma.productCode.deleteMany(args);
			await ctx.prisma.productBase.deleteMany(args);
			await ctx.prisma.productSize.deleteMany(args);
			await ctx.prisma.productVariant.deleteMany(args);

			await ctx.prisma.factory.delete({
				where: {
					id: factoryId
				}
			});
		})
});

export type FactoryRouterInputs = inferRouterInputs<typeof factoryRouter>;
export type FactoryRouterOutputs = inferRouterOutputs<typeof factoryRouter>;