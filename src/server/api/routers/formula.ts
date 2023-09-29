import { addFormulaSchema } from '@/schemas/formula';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import type { Formula, FormulaComponent } from '@prisma/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type TFormulaWithComponents = Formula & {
	Components: FormulaComponent[];
};

export const formulaRouter = createTRPCRouter({
	getAll: publicProcedure
		.input(z.object({ factoryId: z.string() }))
		.query(async ({ ctx, input }) => {
			const formulas = await ctx.prisma.formula.findMany({
				where: {
					factoryId: input.factoryId
				},
				include: {
					Components: true
				}
			});
			return formulas ?? [];
		}),
	add: publicProcedure
		.input(addFormulaSchema)
		.mutation(async ({ ctx, input }) => {
			const { factoryId, baseCode, sizeCode, variantCode, formulaComponents } = input;

			const formula = await ctx.prisma.formula.create({
				data: {
					Factory: {
						connect: {
							id: factoryId
						}
					},
					Product: {
						connect: {
							factoryId_baseCode_sizeCode_variantCode: {
								factoryId, baseCode, sizeCode, variantCode
							}
						}
					},
					Components: {
						create: formulaComponents.map(({ baseCode, sizeCode, variantCode, proportion, note }) => (
							{
								Factory: {
									connect: {
										id: factoryId
									}
								},
								Product: {
									connect: {
										factoryId_baseCode_sizeCode_variantCode: {
											factoryId, baseCode, sizeCode, variantCode
										}
									}
								},
								proportion,
								note
							}
						))
					}
				}
			});

			const formulaWithComponents = await ctx.prisma.formula.findUniqueOrThrow({
				where: {
					id: formula.id
				},
				include: {
					Components: true
				}
			});

			return formulaWithComponents;
		}),
	addMany: publicProcedure
		.input(z.array(addFormulaSchema))
		.mutation(async ({ ctx, input }) => {
			const formulas: TFormulaWithComponents[] = [];

			for await (const {
				factoryId,
				baseCode,
				sizeCode,
				variantCode,
				formulaComponents
			} of input) {
				const formula = await ctx.prisma.formula.create({
					data: {
						Factory: {
							connect: {
								id: factoryId
							}
						},
						Product: {
							connect: {
								factoryId_baseCode_sizeCode_variantCode: {
									factoryId, baseCode, sizeCode, variantCode
								}
							}
						},
						Components: {
							create: formulaComponents.map(({ baseCode, sizeCode, variantCode, proportion, note }) => (
								{
									Factory: {
										connect: {
											id: factoryId
										}
									},
									Product: {
										connect: {
											factoryId_baseCode_sizeCode_variantCode: {
												factoryId, baseCode, sizeCode, variantCode
											}
										}
									},
									proportion,
									note
								}
							))
						}
					}
				});

				const formulaWithComponents = await ctx.prisma.formula.findUniqueOrThrow({
					where: {
						id: formula.id
					},
					include: {
						Components: true
					}
				});

				formulas.push(formulaWithComponents);
			}

			return formulas;
		})
});

export type FormulaRouterInputs = inferRouterInputs<typeof formulaRouter>;
export type FormulaRouterOutputs = inferRouterOutputs<typeof formulaRouter>;