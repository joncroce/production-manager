import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addBlendSchema, blendStatusSchema, getBlendsByStatusSchema } from '@/schemas/blend';
import type { Blend } from '@prisma/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const blendRouter = createTRPCRouter({
	getAll: publicProcedure
		.input(z.object({
			factoryId: z.string()
		}))
		.query(({ ctx, input }) => {
			return ctx.prisma.blend.findMany({
				where: {
					factoryId: input.factoryId
				},
			});
		}),
	getBlendsByStatus: publicProcedure
		.input(getBlendsByStatusSchema)
		.query(({ ctx, input }) => {
			return ctx.prisma.blend.findMany({
				where: {
					status: {
						in: input.status
					}
				}
			});
		}),
	get: publicProcedure
		.input(z.object({ factoryId: z.string(), id: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.blend.findUniqueOrThrow({
				where: {
					factoryId: input.factoryId,
					id: input.id
				},
				include: {
					BlendTank: true,
					Components: {
						include: {
							SourceTank: true,
							Product: true,
						}
					},
					DestinationTank: true,
					Product: true,
					Formula: true
				}
			});
		}),
	add: publicProcedure
		.input(addBlendSchema)
		.mutation(async ({ ctx, input }) => {
			const { factoryId, formulaId, baseCode, sizeCode, variantCode, destinationTankName, targetQuantity, status, note } = input;

			return await ctx.prisma.$transaction(async (tx) => {
				const blend = await tx.blend.create({
					data: {
						Factory: {
							connect: {
								id: factoryId
							}
						},
						Formula: {
							connect: {
								id: formulaId
							}
						},
						Product: {
							connect: {
								factoryId_baseCode_sizeCode_variantCode: {
									factoryId, baseCode, sizeCode, variantCode
								}
							}
						},
						DestinationTank: {
							connect: {
								name_factoryId: {
									name: destinationTankName, factoryId
								}
							}
						},
						targetQuantity,
						status,
						note
					}
				});

				for await (const {
					baseCode, sizeCode, variantCode, sourceTankName, targetQuantity, note
				} of input.components) {
					await tx.blendComponent.create({
						data: {
							Factory: {
								connect: {
									id: factoryId
								}
							},
							Blend: {
								connect: {
									id: blend.id
								}
							},
							Product: {
								connect: {
									factoryId_baseCode_sizeCode_variantCode: {
										factoryId, baseCode, sizeCode, variantCode
									}
								}
							},
							SourceTank: {
								connect: {
									name_factoryId: {
										name: sourceTankName, factoryId
									}
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
	addMany: publicProcedure
		.input(z.array(addBlendSchema))
		.mutation(async ({ ctx, input }) => {
			const blends: Blend[] = [];

			for await (const {
				factoryId,
				formulaId,
				baseCode,
				sizeCode,
				variantCode,
				targetQuantity,
				destinationTankName,
				status,
				note,
				components
			} of input) {
				await ctx.prisma.$transaction(async (tx) => {
					const blend = await tx.blend.create({
						data: {
							Factory: {
								connect: {
									id: factoryId
								}
							},
							Formula: {
								connect: {
									id: formulaId
								}
							},
							Product: {
								connect: {
									factoryId_baseCode_sizeCode_variantCode: {
										factoryId, baseCode, sizeCode, variantCode
									}
								}
							},
							DestinationTank: {
								connect: {
									name_factoryId: {
										name: destinationTankName, factoryId
									}
								}
							},
							targetQuantity,
							status,
							note
						}
					});

					for await (const {
						baseCode, sizeCode, variantCode, sourceTankName, targetQuantity, note
					} of components) {
						await tx.blendComponent.create({
							data: {
								Factory: {
									connect: {
										id: factoryId
									}
								},
								Blend: {
									connect: {
										id: blend.id
									}
								},
								Product: {
									connect: {
										factoryId_baseCode_sizeCode_variantCode: {
											factoryId, baseCode, sizeCode, variantCode
										}
									}
								},
								SourceTank: {
									connect: {
										name_factoryId: {
											name: sourceTankName, factoryId
										}
									}
								},
								targetQuantity,
								note
							}
						});
					}

					blends.push(blend);
				});
			}

			return blends;
		}),
	updateBlendTank: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			id: z.string(),
			blendTankName: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();
			const updatedBlend = ctx.prisma.blend.update({
				where: {
					factoryId: input.factoryId,
					id: input.id
				},
				data: input.blendTankName ? {
					BlendTank: {
						connect: {
							name_factoryId: {
								name: input.blendTankName,
								factoryId: input.factoryId
							}
						}
					},
					updatedAt: now
				} : {
					blendTankName: null,
					updatedAt: now
				}
			});

			return updatedBlend;
		}),
	updateDestinationTank: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			id: z.string(),
			destinationTankName: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();
			const updatedBlend = ctx.prisma.blend.update({
				where: {
					factoryId: input.factoryId,
					id: input.id
				},
				data: input.destinationTankName ? {
					DestinationTank: {
						connect: {
							name_factoryId: {
								name: input.destinationTankName,
								factoryId: input.factoryId
							}
						}
					},
					updatedAt: now
				} : {
					destinationTankName: null,
					updatedAt: now
				}
			});

			return updatedBlend;
		}),
	updateBlendStatus: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			id: z.string(),
			status: blendStatusSchema
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();
			const updatedBlend = ctx.prisma.blend.update({
				where: {
					factoryId: input.factoryId,
					id: input.id
				},
				data: {
					status: input.status,
					updatedAt: now
				}
			});

			return updatedBlend;
		}),
	updateNote: publicProcedure
		.input(z.object({
			blendId: z.string(),
			note: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.blend.update({
				where: {
					id: input.blendId,
				},
				data: {
					note: input.note ?? null,
					updatedAt: now
				},
			});
		}),
	updateComponentActualQuantity: publicProcedure
		.input(z.object({
			blendId: z.string(),
			componentId: z.string(),
			actualQuantity: z.number().min(0).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.blendComponent.update({
				where: {
					blendId: input.blendId,
					id: input.componentId
				},
				data: {
					actualQuantity: input.actualQuantity ?? null,
					Blend: {
						update: {
							updatedAt: now
						}
					}
				},
				include: {
					Product: {
						select: {
							description: true
						}
					}
				}
			});
		}),
	updateComponentNote: publicProcedure
		.input(z.object({
			blendId: z.string(),
			componentId: z.string(),
			note: z.string().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.blendComponent.update({
				where: {
					blendId: input.blendId,
					id: input.componentId
				},
				data: {
					note: input.note ?? null,
					Blend: {
						update: {
							updatedAt: now
						}
					}
				},
				include: {
					Product: {
						select: {
							description: true
						}
					}
				}
			});
		})
});

export type BlendRouter = typeof blendRouter;
export type BlendRouterInputs = inferRouterInputs<BlendRouter>;
export type BlendRouterOutputs = inferRouterOutputs<BlendRouter>;