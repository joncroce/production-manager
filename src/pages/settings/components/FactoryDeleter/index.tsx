import React from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

function FactoryDeleter({
	id,
	name,
	onFactoryDeleted
}: {
	id: string;
	name: string;
	onFactoryDeleted: () => void;
}): React.JSX.Element {
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [input, setInput] = React.useState('');
	const { toast } = useToast();

	const deleteFactory = api.factory.delete.useMutation({
		onSuccess() {
			toast({
				title: 'Factory Deleted'
			});
			onFactoryDeleted();
		},
		onError(error) {
			toast({
				title: 'Error Deleting Factory',
				description: error.message
			});
		},
	});

	const handleDeleteFactory = () => {
		if (input === name) {
			deleteFactory.mutate({ factoryId: id });
		}
	};

	function onDialogOpenChange(open: boolean) {
		if (open) {
			setDialogOpen(true);
		} else {
			setDialogOpen(false);
			setInput('');
		}
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
			<Button variant="destructive" onClick={() => setDialogOpen(true)}>
				Delete Factory
			</Button>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirm Factory Deletion</DialogTitle>
					<DialogDescription>
						<p>Enter factory name <span className="text-red-500 font-semibold">{name}</span> to confirm.</p>
					</DialogDescription>
				</DialogHeader>
				<Label htmlFor="factoryName">Factory Name</Label>
				<Input id="factoryName" value={input} onChange={(e) => setInput(e.currentTarget.value)} />
				<DialogFooter className="p-2 flex justify-between items-center">
					<Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
					<Button variant='destructive' onClick={handleDeleteFactory} disabled={input !== name}>Confirm Deletion</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default FactoryDeleter;