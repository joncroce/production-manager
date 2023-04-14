import { createTRPCRouter, publicProcedure } from '../trpc';
import { addBlendSchema, addFormulaSchema, getBlendableProductSchema } from '@/schemas/blending';

export const blendingRouter = createTRPCRouter({
	getAllBlendableProducts: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.blendableProduct.findMany({
			include: {
				Product: {
					include: {
						Code: {
							include: {
								BaseCode: true,
								SizeCode: true,
								VariantCode: true,
							}
						}
					}
				}
			}
		});
	}),
	getBlendableProduct: publicProcedure
		.input(getBlendableProductSchema)
		.query(({ ctx, input }) => {
			const { baseCodeId, sizeCodeId, variantCodeId } = input;
			if (baseCodeId === undefined) {
				return null;
			}
			return ctx.prisma.blendableProduct.findUnique({
				where: {
					baseCodeId_sizeCodeId_variantCodeId: {
						baseCodeId, sizeCodeId, variantCodeId
					}
				},
				include: {
					Product: {
						include: {
							Code: {
								include: {
									BaseCode: true,
									SizeCode: true,
									VariantCode: true,
								}
							},
							SourceTanks: true
						}
					},
					Formulas: {
						include: {
							Components: {
								include: {
									Product: {
										include: {
											Code: {
												include: {
													BaseCode: true,
													SizeCode: true,
													VariantCode: true,
												}
											},
											SourceTanks: true,
										}
									}
								}
							}
						}
					}
				}
			});
		}),
	addBlend: publicProcedure
		.input(addBlendSchema)
		.mutation(async ({ ctx, input }) => {
			const { baseCodeId, sizeCodeId, variantCodeId, formulaId, destinationTankId, targetQuantity, note } = input;

			return await ctx.prisma.$transaction(async (tx) => {
				const blend = await tx.blend.create({
					data: {
						BlendableProduct: {
							connect: {
								baseCodeId_sizeCodeId_variantCodeId: {
									baseCodeId, sizeCodeId, variantCodeId
								}
							}
						},
						Formula: {
							connect: {
								id: formulaId
							}
						},
						DestinationTank: {
							connect: {
								id: destinationTankId
							}
						},
						targetQuantity,
						note
					}
				});

				for await (const {
					formulaComponentId, sourceTankId, targetQuantity, note
				} of input.components) {
					await tx.blendComponent.create({
						data: {
							Blend: {
								connect: {
									id: blend.id
								}
							},
							FormulaComponent: {
								connect: {
									id: formulaComponentId
								}
							},
							SourceTank: {
								connect: {
									id: sourceTankId
								}
							},
							targetQuantity,
							note
						}
					});
				}

				return blend;
			});
		}),
	addFormula: publicProcedure
		.input(addFormulaSchema)
		.mutation(async ({ ctx, input }) => {
			const { baseCodeId, sizeCodeId, variantCodeId } = input;

			const formula = await ctx.prisma.blendFormula.create({
				data: {
					BlendableProduct: {
						connectOrCreate: {
							where: {
								baseCodeId_sizeCodeId_variantCodeId: {
									baseCodeId, sizeCodeId, variantCodeId
								}
							},
							create: {
								baseCodeId, variantCodeId
							}
						}
					},
					Components: {
						create: input.formulaComponents.map(({ baseCodeId, sizeCodeId, variantCodeId, proportion, note }) => {
							return {
								Product: {
									connect: {
										baseCodeId_sizeCodeId_variantCodeId: {
											baseCodeId, sizeCodeId, variantCodeId
										}
									}
								},
								proportion,
								note
							};
						})
					},
				}
			});

			return formula;
		})
});

export type BlendingRouter = typeof blendingRouter;