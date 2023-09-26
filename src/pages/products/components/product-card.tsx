import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRightIcon } from 'lucide-react';
import { buildProductCode } from '@/utils/product';
import type { Prisma } from '@prisma/client';

export default function ProductCard({
	baseCode,
	sizeCode,
	variantCode,
	description,
	quantityInStock,
	salesPrice
}: {
	baseCode: number;
	sizeCode: number;
	variantCode: number;
	description: string;
	quantityInStock: Prisma.Decimal;
	salesPrice: Prisma.Decimal | null;
}): React.JSX.Element {
	const productCode = buildProductCode(baseCode, sizeCode, variantCode);
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{productCode}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p>{description}</p>
				<p>{quantityInStock.toFixed(2)} in stock</p>
				{salesPrice
					? <p>${salesPrice.toFixed(2)}</p>
					: null}
			</CardContent>
			<CardFooter>
				<Link href={`/products/view/${productCode}`}><Button>Product Details <ArrowUpRightIcon className="ml-2 stroke-white fill-black" /></Button></Link>
			</CardFooter>
		</Card>
	);
}