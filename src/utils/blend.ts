import type { TBlendSummary } from '@/schemas/blend';
import type { Blend as TBlend } from '@prisma/client';
import { padCodePart } from './product';

export function toBlendSummary(blend: Omit<TBlend, 'factoryId' | 'formulaId' | 'note'>): TBlendSummary {
	const { id, baseCode, targetQuantity, actualQuantity, blendTankName, destinationTankName, status, createdAt, updatedAt } = blend;

	return {
		id: id,
		baseCode: padCodePart(baseCode),
		targetQuantity: Number(targetQuantity),
		actualQuantity: actualQuantity ? Number(actualQuantity) : undefined,
		blendTankName: blendTankName ?? undefined,
		destinationTankName: destinationTankName ?? undefined,
		status,
		createdAt: createdAt.getTime(),
		updatedAt: updatedAt.getTime()
	};
}