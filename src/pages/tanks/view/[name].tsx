import React, { useRef, useState } from 'react';
import { createServerSideHelpers } from '@trpc/react-query/server';
import { authenticatedSSProps, getServerAuthSession } from '@/server/auth';
import { createInnerTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';
import Layout from '@/components/Layout';
import Timestamp from '@/components/Timestamp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertOctagonIcon, Edit2Icon } from 'lucide-react';
import { api } from '@/utils/api';
import superjson from '@/utils/superjson';
import { useRouter } from 'next/router';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import type { GetServerSideProps } from 'next';
import type { NextPageWithLayout } from '../../_app';
import type { Session } from 'next-auth';

export const getServerSideProps: GetServerSideProps = async (context) => {
	const session = await getServerAuthSession(context);

	return authenticatedSSProps(context).then(async ({ props, redirect }) => {
		if (redirect) {
			return { props, redirect };
		}

		if (typeof context.params?.name !== 'string') {
			return { props, redirect: { destination: '/404', permanent: false } };
		} else {
			const helpers = createServerSideHelpers({
				router: appRouter,
				ctx: createInnerTRPCContext({ session }),
				transformer: superjson
			});

			const name = (context.params?.name ?? '');
			await helpers.tank.getTankByName.prefetch({ factoryId: props.user?.factoryId ?? '', name });

			return {
				props: {
					...props,
					name,
					trpcState: helpers.dehydrate()
				},
				redirect
			};
		}
	});
};

const ViewTankPage: NextPageWithLayout<{ user: Session['user']; name: string; }> = ({ user, name }) => {
	const [inEditMode, setInEditMode] = useState(false);
	const tankQuery = api.tank.getTankByName.useQuery({
		factoryId: user.factoryId ?? '',
		name
	}, {
		refetchOnWindowFocus: false,
	});
	const { data: tank } = tankQuery;
	const { factoryId } = user;

	if (!factoryId || !tank) throw new Error('Error retrieving tank data.');

	return (
		<>
			<div className="p-2 flex justify-between items-end space-x-2 border-b">
				<h2 className="text-3xl font-bold">Tank Details</h2>
				<TankName inEditMode={inEditMode} factoryId={factoryId} currentName={name} />
				{
					inEditMode
						? <Button variant='default' onClick={() => setInEditMode(false)}>Switch to View Mode</Button>
						: <Button variant='destructive' onClick={() => setInEditMode(true)}>Switch to Edit Mode</Button>
				}
			</div>
			<div className="flex justify-center items-baseline space-x-4">
				<Timestamp time={tank.updatedAt} label="Updated" />
			</div>
		</>
	);
};

ViewTankPage.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

function TankName({
	inEditMode,
	factoryId,
	currentName,
}: {
	inEditMode: boolean;
	factoryId: string;
	currentName: string;
}): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(currentName);
	const [inputValid, setInputValid] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const router = useRouter();

	const { toast } = useToast();

	const mutation = api.tank.updateTankName.useMutation({
		async onSuccess(data) {
			toast({
				title: 'Updated Tank Name',
				description: <span className="font-semibold">{data.name}</span>
			});

			setInputValid(true);
			setErrorMessage(null);
			setOpen(false);

			await router.push(`/tanks/view/${data.name}`);
		},
		onError(error) {
			toast({
				title: 'You attempted to set an invalid tank name!',
				description: error.message
			});

			setInputValid(false);
			setErrorMessage(error.message);
		}
	});


	function saveName() {
		if (inputRef.current) {
			const newName = inputRef.current.value;
			if (newName !== currentName) {
				const schema = z.string().min(1);
				const parsed = schema.safeParse(newName);

				if (parsed.success) {
					mutation.mutate({
						factoryId,
						currentName,
						newName
					});
				} else {
					setInputValid(false);
					const error = parsed.error;
					const message = error.issues.map((issue) => issue.message).join('\n');
					setErrorMessage(message);
					toast({
						title: 'You attempted to set an invalid tank name!',
						description: message
					});
					inputRef.current.focus();
				}
			} else {
				console.log('Tank name was unchanged.');
				setInputValid(true);
				setErrorMessage(null);
				setOpen(false);
			}
		}
	}

	const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined = (event) => {
		if (inputRef.current) {
			if (event.key === 'Enter') {
				saveName();
			} else if (event.key === 'Escape') {
				inputRef.current.value = currentName;
				setValue(currentName);
				setInputValid(true);
				setErrorMessage(null);
			}
		}
	};

	function onOpenChange(open: boolean) {
		if (open) {
			setOpen(open);
		} else if (currentName !== value) {
			setShowWarning(true);
		} else {
			setValue(currentName);
			setOpen(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<div className="flex justify-center items-end space-x-1">
				<span className="text-2xl font-semibold">Name: </span>
				<span className="text-2xl font-bold">{currentName}</span>
				{
					inEditMode
						? <Button variant='ghost' onClick={() => setOpen(true)}>
							<Edit2Icon />
						</Button>
						: null
				}
			</div>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change Tank Name</DialogTitle>
				</DialogHeader>

				{showWarning
					? <>
						<div className="flex justify-start items-stretch space-x-2">
							<AlertOctagonIcon className="stroke-white text-red-500" />
							<span className="font-semibold">Tank Name has unsaved changes!</span>
						</div>
						<p>
							Press <span className="font-semibold">Cancel</span> to return to editing the tank name, or <span className="font-semibold">Confirm</span> to discard changes.
						</p>
						<DialogFooter>
							<Button variant='outline' onClick={() => setShowWarning(false)}>Cancel</Button>
							<Button
								variant='destructive'
								onClick={() => {
									setShowWarning(false);
									setOpen(false);
									setValue(currentName);
									setInputValid(true);
								}}
							>
								Confirm
							</Button>
						</DialogFooter>
					</>
					: <>
						{
							errorMessage
								? <span className="text-sm text-red-400">{errorMessage}</span>
								: null
						}
						<Input
							className="data-[valid=false]:border-red-500 data-[valid=false]:bg-red-100"
							ref={inputRef}
							size={10}
							placeholder="Enter Tank Name..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onKeyDownCapture={handleKeyDown}
							data-valid={inputValid}
						/>
						<DialogFooter className="flex justify-between">
							<Button variant={value !== currentName ? 'destructive' : 'outline'} onClick={() => setOpen(false)}>Cancel</Button>
							<Button variant='default' onClick={saveName}>Save</Button>
						</DialogFooter>
					</>
				}
			</DialogContent>
		</Dialog>
	);
}

export default ViewTankPage;;