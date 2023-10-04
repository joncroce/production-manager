import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { buildProductCode } from '@/utils/product';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from './components/formula-list/data-table';
import { columns, type TFormulaListItem } from './components/formula-list/columns';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';
import type { FormulaRouterOutputs } from '@/server/api/routers/formula';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context)
		.then(async ({ props, redirect }) => {
			if (redirect) {
				return { props, redirect };
			}

			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			await helpers.formula.getAll.prefetch({ factoryId: props.user.factoryId! });

			return {
				props: {
					...props,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		});
};

function mapFormulaToListItem(formula: FormulaRouterOutputs['getAll'][number]): TFormulaListItem {
	const { baseCode, sizeCode, variantCode } = formula;
	const targetProductCode = buildProductCode(baseCode, sizeCode, variantCode);

	return {
		id: formula.id,
		targetProductCode,
		blendCount: formula._count.Blends,
		components: formula.Components.map((component) => {
			const { baseCode, sizeCode, variantCode } = component;
			const componentProductCode = buildProductCode(baseCode, sizeCode, variantCode);

			return {
				componentProductCode,
				proportion: component.proportion
			};
		})
	};
}

const FormulasPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const factoryId = user.factoryId!;

	if (!factoryId) {
		throw new Error('No Factory found.');
	}

	const formulasQuery = api.formula.getAll.useQuery(
		{ factoryId },
		{ refetchOnWindowFocus: false }
	);

	const { data: formulas } = formulasQuery;

	if (!formulas) {
		throw new Error('Error retrieving formulas data.');
	}

	const formulasAsTarget = formulas.map(mapFormulaToListItem);

	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Formulas</h2>

				<div className="flex items-end space-x-2 text-2xl">
					<Link href="formulas/add"><Button>Add Formula</Button></Link>
				</div>
			</div>
			<div className="p-4">
				<DataTable columns={columns} data={formulasAsTarget} />
			</div>
		</>
	);
};

FormulasPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default FormulasPage;