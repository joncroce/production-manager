import Layout from '@/components/Layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from './components/blend-list/data-table';
import { columns, sortableColumns } from './components/blend-list/columns';
import { useState } from 'react';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import { toBlendSummary } from '@/utils/blend';
import { ACTIVE_BLEND_STATUSES, type TBlendSummary } from '@/schemas/blend';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';
import type { NextPageWithLayout } from '../_app';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

function sortByRecentlyCreated(a: TBlendSummary, b: TBlendSummary): number {
	return a.createdAt - b.createdAt;
}

function sortByUpdatedAt(a: TBlendSummary, b: TBlendSummary): number {
	return a.updatedAt - b.updatedAt;
}

function getRecentlyCreated(blends: Array<TBlendSummary>): Array<TBlendSummary> {
	return Array.from(blends).sort(sortByRecentlyCreated);
}

function getCurrentlyActive(blends: Array<TBlendSummary>): Array<TBlendSummary> {
	return blends.filter(({ status }) => ACTIVE_BLEND_STATUSES.includes(status)).sort(sortByUpdatedAt);
}

const BlendsPage: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [blends, setBlends] = useState<Array<TBlendSummary>>([]);
	api.blend.findAll.useQuery(
		{ factoryId: user?.factoryId ?? '' },
		{
			enabled: user.factoryId !== undefined,
			refetchOnWindowFocus: false,
			onSuccess(data) {
				setBlends(data.map(toBlendSummary));
			},
		}
	);

	return (
		<>
			<div className="flex justify-between border-b p-2">
				<h2 className="text-3xl font-bold">Blends</h2>

				<div className="flex items-end space-x-2 text-2xl">
					<Link href="blends/add-blend"><Button>Add Blend</Button></Link>
					<Link href="blends/add-formula"><Button>Add Formula</Button></Link>
				</div>
			</div>
			<div className="p-4">
				<Tabs defaultValue='currentlyActive'>
					<TabsList>
						<TabsTrigger value="currentlyActive">Currently Active</TabsTrigger>
						<TabsTrigger value="recentlyCreated">Recently Created</TabsTrigger>
						<TabsTrigger value="viewAll">View All</TabsTrigger>
					</TabsList>
					<TabsContent value="currentlyActive">
						<DataTable columns={columns} data={getCurrentlyActive(blends)} />
					</TabsContent>
					<TabsContent value="recentlyCreated">
						<DataTable columns={columns} data={getRecentlyCreated(blends)} usePagination={true} />
					</TabsContent>
					<TabsContent value="viewAll">
						<DataTable columns={sortableColumns} data={blends} usePagination={true} />
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
};

BlendsPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default BlendsPage;