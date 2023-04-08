import { createTRPCRouter, publicProcedure } from '../trpc';
import { addFormulaSchema } from '@/schemas/blending';

export const blendingRouter = createTRPCRouter({
	getAllBlendableProducts: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.blendableProduct.findMany();
	}),
	addFormula: publicProcedure
		.input(addFormulaSchema)
		.mutation(async ({ ctx, input }) => {

			const formula = await ctx.prisma.blendFormula.create({
				data: {
					Components: {
						create: input.formulaComponents.map(({ baseCodeId, proportion, note }) => {
							return {
								BaseCode: {
									connect: {
										id: baseCodeId
									}
								},
								proportion,
								note
							};
						})
					},
					Product: {
						connectOrCreate: {
							where: {
								baseCodeId: input.baseCodeId
							},
							create: {
								baseCodeId: input.baseCodeId
							}
						}
					}
				}
			});

			return formula;
		})
});

export type BlendingRouter = typeof blendingRouter;