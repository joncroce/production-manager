import React from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { api } from '@/utils/api';
import { appRouter } from '@/server/api/root';
import { createInnerTRPCContext } from '@/server/api/trpc';
import superjson from '@/utils/superjson';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addBlendSchema } from '@/schemas/blend';
import { buildProductCode } from '@/utils/product';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { columns as blendsColumns } from '@/pages/blends/components/blend-list/columns';
import { DataTable as BlendsDataTable } from '@/pages/blends/components/blend-list/data-table';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import ProductCard from '@/pages/products/components/product-card';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/router';
import { z } from 'zod';
import type { NextPageWithLayout } from '../../_app';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { FormulaRouterOutputs } from '@/server/api/routers/formula';
import type { Prisma } from '@prisma/client';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context)
		.then(async ({ props, redirect }) => {
			if (redirect) {
				return { props, redirect };
			}

			if (typeof context.params?.id !== 'string') {
				return { props, redirect: { destination: '/404', permanent: false } };
			}

			const id = context.params.id;
			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			await helpers.formula.get
				.prefetch({
					factoryId: props.user.factoryId!,
					id
				});

			return {
				props: {
					...props,
					formulaId: id,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

const ViewFormula: NextPageWithLayout<{ user: Session['user']; formulaId: string; }> = ({ user, formulaId }) => {
	const factoryId = user.factoryId!;
	const formulaQuery = api.formula.get.useQuery({
		factoryId,
		id: formulaId
	}, {
		enabled: formulaId !== undefined,
		refetchOnWindowFocus: false

	});

	const { data: formula } = formulaQuery;

	if (!formula) {
		throw new Error('Error retrieving formula data.');
	}

	const schema = z.object({
		targetQuantity: z.string()
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		mode: 'onBlur',
		defaultValues: {
			targetQuantity: '',
		}
	});

	const { toast } = useToast();

	const router = useRouter();

	const addBlend = api.blend.add.useMutation({
		onSuccess(data) {
			const productCode = buildProductCode(data.baseCode, data.sizeCode, data.variantCode);
			toast({
				title: 'Successfully added new blend.',
				description: (
					<>
						<p className="font-semibold">{productCode}</p>
						<p>{data.targetQuantity.toFixed(2)} gal.</p>
					</>
				)
			});
			void router.push(`/blends/view/${data.id}`);
		},
		onError(error) {
			console.error(error);
			toast({
				title: 'Error adding blend!',
				description: error.message
			});
		}
	});

	function onSubmit(data: z.infer<typeof schema>) {
		const blendTargetQuantity = parseInt(data.targetQuantity);
		const newBlend = {
			factoryId,
			formulaId,
			baseCode: formula?.baseCode,
			sizeCode: formula?.sizeCode,
			variantCode: formula?.variantCode,
			targetQuantity: parseInt(data.targetQuantity),
			components: formula?.Components.map((component) => ({
				baseCode: component.baseCode,
				sizeCode: component.sizeCode,
				variantCode: component.variantCode,
				sourceTankName: component.Product.SourceTanks[0]?.name,
				targetQuantity: component.proportion.mul(blendTargetQuantity).toNumber(),
				note: component.note ?? '',
			}))
		};

		const parsed = addBlendSchema.safeParse(newBlend);

		if (parsed.success) {
			addBlend.mutate(newBlend as z.infer<typeof addBlendSchema>);
		} else {
			toast({
				title: 'Error validating blend!',
				description: parsed.error.issues.map((issue, index) => <p key={index}>{issue.message}</p>)
			});
		}

	};

	return (
		<>
			<Head>
				<title>View Formula | Production Manager</title>
				<meta name="description" content="View formula details." />
				<link rel="icon" href="/favicon.svg" />
			</Head>

			<div className="p-2 flex justify-between items-end space-x-2 border-b">
				<h2 className="text-3xl font-bold">Formula Details</h2>
			</div>

			<div className="p-4 flex flex-col space-y-8">
				<div className="flex justify-evenly">
					<div className="flex flex-col items-center space-y-4">
						<h3 className="text-2xl font-bold">Product</h3>
						<ProductCard {...formula.Product} />
					</div>
					<div className="flex flex-col space-y-4">
						<h3 className="text-2xl font-bold">Quick Create Blend</h3>
						<Form {...form}>
							<form
								className="p-4 flex flex-col space-y-10"
								onSubmit={(event) => {
									event.preventDefault();
									void form.handleSubmit(onSubmit)(event);
								}}>
								<div className="flex flex-col justify-between items-center space-y-6">
									<FormField
										control={form.control}
										name="targetQuantity"
										render={({ field }) => (
											<FormItem className="flex flex-col items-center space-y-2">
												<FormLabel className="text-3xl font-semibold">
													Quantity
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder="Enter target quantity..."
														value={field.value}
														onChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
								<Button type="submit">
									Submit
								</Button>
							</form>
						</Form>
					</div>
				</div>
				<FormulaComponents components={formula.Components} />

				<div className="flex flex-col space-y-4">
					<h3 className="text-2xl font-semibold">Related Blends</h3>
					<BlendsDataTable columns={blendsColumns} data={formula.Blends} usePagination />
				</div>
			</div>

		</>
	);
};

ViewFormula.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default ViewFormula;

type TFormulaComponent = NonNullable<FormulaRouterOutputs['get']>['Components'][number];
function FormulaComponents({
	components
}: {
	components: Array<TFormulaComponent>;
}): React.JSX.Element {
	const columns: Array<ColumnDef<TFormulaComponent>> = [
		{
			header: 'Code',
			accessorFn(row) {
				const { baseCode, sizeCode, variantCode } = row.Product;
				const productCode = buildProductCode(baseCode, sizeCode, variantCode);

				return productCode;
			},
			cell({ getValue }) {
				const productCode = getValue<string>();

				return <Link className="underline" href={`/products/view/${productCode}`} onClick={(e) => e.stopPropagation()}>{productCode}</Link>;
			},
		},
		{
			header: 'Description',
			accessorFn(row) {
				return row.Product.description;
			},
		},
		{
			header: 'Proportion',
			accessorKey: 'proportion',
			cell({ getValue }) {
				return getValue<Prisma.Decimal>().toFixed(2);
			}
		},
		{
			header: 'Qty in Stock',
			accessorFn(row) {
				return row.Product.quantityInStock;
			},
			cell({ getValue }) {
				return getValue<Prisma.Decimal>().toFixed(2);
			}
		},
	];

	const table = useReactTable({
		data: components,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		initialState: {
			sorting: [{
				id: 'proportion',
				desc: true
			}]
		},
	});

	return (
		<div className="flex flex-col space-y-4">
			<h3 className="text-2xl font-bold">Components</h3>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className='cursor-pointer'
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No Components.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}