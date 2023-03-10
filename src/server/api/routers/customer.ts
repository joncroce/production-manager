import { createTRPCRouter, publicProcedure } from '../trpc';
import { addCustomerSchema } from '@/schemas/customer';
import type { Address } from '@prisma/client';

export const customerRouter = createTRPCRouter({
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.customer.findMany({
			include: {
				Orders: {
					include: {
						Items: true
					}
				},
				Addresses: true
			}
		});
	}),

	add: publicProcedure
		.input(addCustomerSchema)
		.mutation(async ({ ctx, input }) => {
			const { name, DefaultBillingAddress, DefaultShippingAddress } = input;

			return await ctx.prisma.$transaction(async (tx) => {

				let customer = await tx.customer.create({
					data: {
						name
					}
				});

				const billingAddress = await tx.address.create({
					data: {
						Customer: {
							connect: {
								id: customer.id
							}
						},
						...DefaultBillingAddress
					}
				});

				// Check if shipping address is the same as billing address
				const sameAddresses = (Object.keys(DefaultBillingAddress) as (keyof Omit<Address, 'id' | 'customerId'>)[])
					.every((key) => DefaultBillingAddress[key] === DefaultShippingAddress[key]);

				const shippingAddress = sameAddresses
					? billingAddress
					: await tx.address.create({
						data: {
							Customer: {
								connect: {
									id: customer.id
								}
							},
							...DefaultShippingAddress
						}
					});

				customer = await tx.customer.update({
					where: {
						id: customer.id
					},
					data: {
						DefaultBillingAddress: {
							connect: {
								id: billingAddress.id
							}
						},
						DefaultShippingAddress: {
							connect: {
								id: shippingAddress.id
							}
						}
					},
				});

				return customer;
			});

		})
});