import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from "../trpc";
import { addProductSchema, getBlendableProductSchema } from '@/schemas/product';
import type { Product } from '@prisma/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { parseProductCode } from '@/utils/product';

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
			productCode: z.string(),
		}))
		.query(({ ctx, input }) => {
			const { baseCode, sizeCode, variantCode } = parseProductCode(input.productCode);
			return ctx.prisma.product.findUnique({
				where: {
					factoryId_baseCode_sizeCode_variantCode: {
						factoryId: input.factoryId,
						baseCode, sizeCode, variantCode
					}
				},
				include: {
					Code: {
						include: {
							ProductBase: true,
							ProductSize: true,
							ProductVariant: true
						}
					},
					Blends: true,
					BlendComponents: {
						include: {
							Blend: true
						}
					},
					SourceTanks: true
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
				include: {
					Code: {
						include: {
							ProductBase: true,
							ProductSize: true,
							ProductVariant: true
						}
					},
				}
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
		}),
	updateDescription: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			productCode: z.string(),
			description: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { baseCode, sizeCode, variantCode } = parseProductCode(input.productCode);

			return ctx.prisma.product.update({
				where: {
					factoryId_baseCode_sizeCode_variantCode: {
						factoryId: input.factoryId,
						baseCode, sizeCode, variantCode
					}
				},
				data: {
					description: input.description,
					updatedAt: new Date()
				}
			});
		}),
	updateQuantity: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			productCode: z.string(),
			quantityInStock: z.coerce.number().min(0),
		}))
		.mutation(async ({ ctx, input }) => {
			const { baseCode, sizeCode, variantCode } = parseProductCode(input.productCode);

			return ctx.prisma.product.update({
				where: {
					factoryId_baseCode_sizeCode_variantCode: {
						factoryId: input.factoryId,
						baseCode, sizeCode, variantCode
					}
				},
				data: {
					quantityInStock: input.quantityInStock,
					updatedAt: new Date()
				}
			});
		}),
	updatePrice: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			productCode: z.string(),
			salesPrice: z.coerce.number().min(0).nullable(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { baseCode, sizeCode, variantCode } = parseProductCode(input.productCode);

			return ctx.prisma.product.update({
				where: {
					factoryId_baseCode_sizeCode_variantCode: {
						factoryId: input.factoryId,
						baseCode, sizeCode, variantCode
					}
				},
				data: {
					salesPrice: input.salesPrice,
					updatedAt: new Date()
				}
			});
		}),
});

export type ProductRouter = typeof productRouter;
export type ProductRouterInputs = inferRouterInputs<ProductRouter>;
export type ProductRouterOutputs = inferRouterOutputs<ProductRouter>;