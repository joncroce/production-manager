import styles from './manage.module.css';
import React, { useState, type MouseEventHandler, type PropsWithChildren } from 'react';
import Layout from '@/components/Layout';
import { MingcuteListOrderedFill } from '@/components/NavBar';
import DescendingNumericIcon from '@/components/Icons/DescendingNumericIcon';
import AscendingNumericIcon from '@/components/Icons/AscendingNumericIcon';
import DescendingAlphabeticicIcon from '@/components/Icons/DescendingAlphabeticIcon';
import AscendingAlphabeticIcon from '@/components/Icons/AscendingAlphabeticIcon';
import Sorter from '@/components/Sorter';
import * as Tabs from '@radix-ui/react-tabs';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import { z } from 'zod';
import type { GetServerSideProps } from 'next';
import type { NextPageWithLayout } from '../_app';
import type { Session } from 'next-auth';
import type { UsersOnTanks } from '@prisma/client';
import type { UserRouter } from '@/server/api/routers/user';
import type { TankRouter } from '@/server/api/routers/tank';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const listTabValue = "list";
const defaultTabValue = listTabValue;

const Tanks: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [activeTabValue, setActiveTabValue] = useState<string>(defaultTabValue);
	const userViewingTanks = api.user.getTankViews.useQuery({ userId: user.id });
	const addTankView = api.user.addTankView.useMutation();
	const removeTankView = api.user.removeTankView.useMutation();

	const utils = api.useContext();

	const addTab = (input: UserAddTankInput) => {
		addTankView.mutate(input, {
			async onSuccess(data) {
				setActiveTabValue(data.tankName);
				await utils.user.getTankViews.invalidate({ userId: user.id });
			},
		});
	};

	const removeTab = (input: UserRemoveTankInput) => {
		removeTankView.mutate(input, {
			async onSuccess() {
				setActiveTabValue(defaultTabValue);
				await utils.user.getTankViews.invalidate({ userId: user.id });
			}
		});
	};

	return (
		<main>
			<article className={styles['tanks']}>
				<h1 className={styles['tanks__header']}>Tanks</h1>
				{userViewingTanks.data && userViewingTanks.data.ViewingTanks.length
					? <Tabs.Root className={styles['tabs__root']} defaultValue={defaultTabValue} value={activeTabValue} onValueChange={(value) => setActiveTabValue(value)}>
						<Tabs.List className={styles['tabs__list']} aria-label="Manage Tanks">
							<ListTrigger />
							<ItemTriggers items={userViewingTanks.data.ViewingTanks} getValue={(userOnTank: UsersOnTanks) => userOnTank.tankName} />
						</Tabs.List>
						<ListContent
							factoryId={user.factoryId ?? ''}
							userId={user.id}
							addTab={addTab}
						/>
						{userViewingTanks.data.ViewingTanks.map((userOnTank) => (
							<Tabs.Content className={styles['tabs__content']} value={userOnTank.tankName} key={userOnTank.tankName}>
								<button onClick={() => removeTab(userOnTank)}>Close</button>
								<pre>{JSON.stringify(userOnTank, undefined, 2)}</pre>
							</Tabs.Content>
						))}
					</Tabs.Root>
					: null
				}

			</article>
		</main>
	);
};

Tanks.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

export default Tanks;

const ListTrigger: React.FC = () => (
	<Tabs.Trigger className={styles['tabs__trigger--accent']} value={listTabValue}>
		<div className={styles['tabs__trigger-inner']}>
			<MingcuteListOrderedFill />
			<span>List</span>
		</div>
	</Tabs.Trigger>
);

type ItemTriggersProps<T> = {
	items: T[];
	getValue: (item: T) => string;
};

const ItemTriggers = <T extends object>({ items, getValue }: ItemTriggersProps<T>) => {
	return (
		<>
			{items.map((item) => {
				const value = getValue(item);
				return (
					<Tabs.Trigger key={value} className={styles['tabs__trigger']} value={value}>
						{value}
					</Tabs.Trigger>
				);
			})}
		</>
	);
};

type RouterOutput = inferRouterOutputs<TankRouter>;
type TankGetAllOutput = RouterOutput['getAll'];
type UserAddTankInput = inferRouterInputs<UserRouter>['addTankView'];
type UserRemoveTankInput = inferRouterInputs<UserRouter>['removeTankView'];
const ListContent: React.FC<{
	factoryId: string;
	userId: string;
	addTab: (input: UserAddTankInput) => void;
}> = ({ factoryId, userId, addTab }) => {
	const [sorts, setSorts] = useState<Sort[]>([]);

	const tanks = api.tank.getAll.useQuery({
		userId,
		factoryId,
		orderBy: sorts.map((sort) => ({ [sort.name]: sort.direction }))
	});

	const addSort = (sort: Sort) => {
		setSorts((prevSorts) => [...prevSorts, sort]);
	};

	const removeSort = (sort: Sort) => {
		const index = sorts.findIndex((value) => sort === value);
		if (index !== -1) {
			setSorts((prevSorts) => prevSorts.slice(0, index).concat(prevSorts.slice(index + 1)));
		}
	};

	const moveSort = (fromIndex: number, toIndex: number) => {
		setSorts((prevSorts) => {
			// Check that indices are different, and both indices are in range
			if (fromIndex === toIndex
				|| ![fromIndex, toIndex].every((index) => index >= 0 && index < prevSorts.length)
			) {
				return prevSorts;
			}

			const result = [...prevSorts];
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			result.splice(toIndex, 0, result.splice(fromIndex, 1)[0]!);

			return result;
		});
	};

	const reverseSort = (sort: Sort) => {
		const index = sorts.findIndex((value) => sort === value);
		if (index !== -1) {
			setSorts((prevSorts) => [
				...prevSorts.slice(0, index),
				{ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' },
				...prevSorts.slice(index + 1)
			]);
		}
	};

	const resetSorts = () => {
		setSorts(() => []);
	};

	const sortableTankSchema = z.object({
		name: z.string(),
		baseCode: z.number(),
		quantity: z.number(),
		capacity: z.number(),
		heel: z.number(),
		isBlendTank: z.boolean(),
	});

	type TSortableTankSchema = z.infer<typeof sortableTankSchema>;
	const fieldLabels: Map<keyof TSortableTankSchema & string, string | null> = new Map(
		[
			['name', 'Name'],
			['baseCode', 'BaseCode'],
			['quantity', 'Qty'],
			['capacity', 'Cap'],
			['heel', 'Heel'],
			['isBlendTank', 'BlendTank']
		]
	);

	const fieldSortTypes: Map<keyof TSortableTankSchema & string, Sort["type"]> = new Map(
		[
			['name', 'alphabetic'],
			['baseCode', 'numeric'],
			['quantity', 'numeric'],
			['capacity', 'numeric'],
			['heel', 'numeric'],
			['isBlendTank', 'alphabetic']
		]
	);

	const formatter = (tank: TankGetAllOutput[number]): Map<keyof TSortableTankSchema & string, string> => {
		const { name, baseCode, quantity, capacity, heel, isBlendTank } = tank;

		return new Map(
			[
				['name', name],
				['baseCode', String(baseCode)],
				['quantity', String(quantity)],
				['capacity', String(capacity)],
				['heel', String(heel)],
				['isBlendTank', isBlendTank ? 'Yes' : 'No']
			]
		);
	};

	return (
		<Tabs.Content className={styles['tabs__content']} value="list">
			<Sorter<TSortableTankSchema>
				sorts={sorts.map((sort) => ({ field: sort.name as keyof TSortableTankSchema, direction: sort.direction }))}
				labels={fieldLabels}
				moveSort={moveSort}
				resetSorts={resetSorts}
			/>
			<table className={styles.table} style={{ gridTemplateColumns: `repeat(${fieldLabels.size + 1}, 1fr)` }}>
				<thead className={styles.thead}>
					<tr className={styles.tr}>
						{
							[...fieldLabels.entries()].map(([fieldName, labelText]) => (
								<th key={String(fieldName)} className={styles.th}>
									{labelText !== null
										? <FieldLabel
											key={fieldName}
											name={String(fieldName)}
											labelText={String(labelText)}
											sortType={fieldSortTypes.get(fieldName) ?? 'alphabetic'}
											sort={sorts.find((sort) => sort.name === fieldName)}
											addSort={addSort}
											removeSort={removeSort}
											reverseSort={reverseSort}
										/>
										: null
									}
								</th>
							))
						}
						<th className={styles.th} />
					</tr>
				</thead>
				<tbody className={styles.tbody}>
					{tanks.data ?
						tanks.data.map(formatter).map((tank) => {
							const tankName = tank.get("name");
							if (typeof tankName === 'string') {
								return (
									<tr key={tankName} className={styles.tr}>
										{[...tank.entries()].map(([k, v]) => (
											<td key={`${tankName}-${k}`} className={styles.td}>{v}</td>
										))}
										<td className={styles.td}>
											<button type="button" onClick={() => addTab({ userId, factoryId, tankName })}>View</button>
										</td>
									</tr>
								);

							}
						})
						: null}
				</tbody>
			</table>
		</Tabs.Content>
	);
};

interface Sort {
	name: string;
	type: 'alphabetic' | 'numeric';
	direction: 'asc' | 'desc';
}

const FieldLabel: React.FC<{
	name: string;
	labelText: string;
	sortType: Sort["type"];
	sort?: Sort;
	addSort: (sort: Sort) => void;
	removeSort: (sort: Sort) => void;
	reverseSort: (sort: Sort) => void;
}> = ({ name, labelText, sortType, sort, addSort, removeSort, reverseSort }) => {
	return (
		<>
			<ToggleSortFieldButton
				key={name}
				sort={sort}
				handleClick={
					() => sort
						? removeSort(sort)
						: addSort({ name, type: sortType, direction: 'asc' })
				}
			>
				{labelText}
			</ToggleSortFieldButton>
			{sort
				? <ToggleSortDirectionButton
					sort={sort}
					reverseSort={reverseSort}
				/>
				: null
			}
		</>
	);
};

const ToggleSortDirectionButton: React.FC<
	{
		sort: Sort;
		reverseSort: (sort: Sort) => void;
	}> = ({ sort, reverseSort }) => {
		return (
			<button
				className={styles.toggleDirection}
				onClick={() => reverseSort(sort)}
			>
				{sort.type === 'numeric'
					? sort.direction === 'desc'
						? <DescendingNumericIcon />
						: <AscendingNumericIcon />
					: sort.direction === 'desc'
						? <DescendingAlphabeticicIcon />
						: <AscendingAlphabeticIcon />
				}
			</button>
		);
	};

const ToggleSortFieldButton: React.FC<
	PropsWithChildren &
	{
		handleClick: MouseEventHandler;
		sort?: Sort;
	}
> = (
	{ handleClick, sort, children }
) => (
		<button
			className={styles.toggleSortFieldButton}
			type="button"
			data-sorting-by={Boolean(sort)}
			onClick={handleClick}
		>
			{children}
		</button>
	);