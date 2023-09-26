import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from "../trpc";
import { addProductSchema, getBlendableProductSchema } from '@/schemas/product';
import type { Product } from '@prisma/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const productRouter = createTRPCRouter({

	getAll: publicProcedure
		.input(z.object({ factoryId: z.string() }))
		.query(({ ctx, input }) =>
			ctx.prisma.product.findMany({
				where: {
					factoryId: input.factoryId
				},
				include: {
					Code: {
						include: {
							ProductBase: true,
							ProductSize: true,
							ProductVariant: true
						}
					}
				}
			})
		),
	getByCode: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			baseCode: z.coerce.number(),
			sizeCode: z.coerce.number(),
			variantCode: z.coerce.number()
		}))
		.query(({ ctx, input }) => {
			return ctx.prisma.product.findUnique({
				where: {
					factoryId_baseCode_sizeCode_variantCode: {
						factoryId: input.factoryId,
						baseCode: input.baseCode,
						sizeCode: input.sizeCode,
						variantCode: input.variantCode
					}
				},
			});
		}),
	getManyByCodeParts: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			baseCode: z.coerce.number().optional(),
			sizeCode: z.coerce.number().optional(),
			variantCode: z.coerce.number().optional()
		}))
		.query(({ ctx, input }) => {
			return ctx.prisma.product.findMany({
				where: {
					factoryId: input.factoryId,
					baseCode: input.baseCode,
					sizeCode: input.sizeCode,
					variantCode: input.variantCode
				},
			});
		}),
	getAllBlendableProducts: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.product.findMany({
			where: {
				Formulas: {
					some: {}
				}
			},
			include: {
				Code: {
					include: {
						ProductBase: true,
						ProductSize: true,
						ProductVariant: true,
					}
				},
				Formulas: {
					include: {
						_count: true
					}
				}
			}
		});
	}),
	getBlendableProduct: publicProcedure
		.input(getBlendableProductSchema)
		.query(({ ctx, input }) => {
			const { factoryId, baseCode, sizeCode, variantCode } = input;
			if (baseCode === undefined) {
				return null;
			}
			return ctx.prisma.product.findUnique({
				where: {
					factoryId_baseCode_sizeCode_variantCode: {
						factoryId, baseCode, sizeCode, variantCode
					}
				},
				include: {
					Code: {
						include: {
							ProductBase: true,
							ProductSize: true,
							ProductVariant: true,
						}
					},
					SourceTanks: true,
					Formulas: {
						include: {
							Components: {
								include: {
									Product: {
										include: {
											Code: {
												include: {
													ProductBase: true,
													ProductSize: true,
													ProductVariant: true,
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
	getAllTankableProducts: publicProcedure
		.input(z.object({
			factoryId: z.string()
		}))
		.query(({ ctx, input }) => {
			return ctx.prisma.product.findMany({
				where: {
					factoryId: input.factoryId,
					sizeCode: 1,
					variantCode: 0
				},
			});
		}),
	add: publicProcedure
		.input(addProductSchema)
		.mutation(async ({ ctx, input }) => {
			const { factoryId, baseCode, sizeCode, variantCode, ...inputValues } = input;
			const product = await ctx.prisma.product.create({
				data: {
					Factory: {
						connect: {
							id: factoryId
						}
					},
					Code: {
						create: {
							Factory: {
								connect: {
									id: factoryId
								}
							},
							ProductBase: {
								connect: {
									factoryId_code: {
										factoryId, code: baseCode
									}
								}
							},
							ProductSize: {
								connect: {
									factoryId_code: {
										factoryId, code: sizeCode
									}
								}
							},
							ProductVariant: {
								connect: {
									factoryId_code: {
										factoryId, code: variantCode
									}
								}
							}
						}
					},
					...inputValues
				}
			});
			return product;
		}),
	addMany: publicProcedure
		.input(z.array(addProductSchema))
		.mutation(async ({ ctx, input }) => {
			const products: Product[] = [];

			for await (const {
				factoryId,
				baseCode,
				sizeCode,
				variantCode,
				description,
				quantityInStock,
				salesPrice
			} of input) {
				const product = await ctx.prisma.product.create({
					data: {
						Factory: {
							connect: {
								id: factoryId
							}
						},
						Code: {
							create: {
								Factory: {
									connect: {
										id: factoryId
									}
								},
								ProductBase: {
									connect: {
										factoryId_code: {
											factoryId, code: baseCode
										}
									}
								},
								ProductSize: {
									connect: {
										factoryId_code: {
											factoryId, code: sizeCode
										}
									}
								},
								ProductVariant: {
									connect: {
										factoryId_code: {
											factoryId, code: variantCode
										}
									}
								}
							}
						},
						description,
						quantityInStock,
						salesPrice
					}
				});

				products.push(product);
			}

			return products;
		})
});

export type ProductRouter = typeof productRouter;
export type ProductRouterInputs = inferRouterInputs<ProductRouter>;
export type ProductRouterOutputs = inferRouterOutputs<ProductRouter>;