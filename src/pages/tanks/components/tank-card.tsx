import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRightIcon } from 'lucide-react';
import { buildProductCode } from '@/utils/product';
import type { Prisma } from '@prisma/client';

export default function TankCard({
	name,
	baseCode,
	sizeCode,
	variantCode,
	quantity,
	capacity,
}: {
	name: string;
	baseCode: number;
	sizeCode: number;
	variantCode: number;
	quantity: Prisma.Decimal;
	capacity: Prisma.Decimal;
}): React.JSX.Element {
	const productCode = buildProductCode(baseCode, sizeCode, variantCode);

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{name}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p>{productCode}</p>
				<p>{quantity.toFixed(0)}/{capacity.toFixed(0)}</p>
			</CardContent>
			<CardFooter>
				<Link href={`/tanks/view/${name}`}><Button>Tank Details <ArrowUpRightIcon className="ml-2 stroke-white fill-black" /></Button></Link>
			</CardFooter>
		</Card>
	);
}