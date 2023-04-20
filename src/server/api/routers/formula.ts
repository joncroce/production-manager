import { addFormulaSchema } from '@/schemas/formula';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import type { Formula } from '@prisma/client';

export const formulaRouter = createTRPCRouter({
	addFormula: publicProcedure
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

			return formula;
		}),
	addFormulas: publicProcedure
		.input(z.array(addFormulaSchema))
		.mutation(async ({ ctx, input }) => {
			const formulas: Formula[] = [];

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

				formulas.push(formula);
			}

			return formulas;
		})
});