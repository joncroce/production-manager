import { useEffect, useRef } from 'react';

type Props = {
	width: number;
	height: number;
	gridSpacing: number;
};

const GridCanvas: React.FC<Props> = ({ width, height, gridSpacing }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			canvas.width = width;
			canvas.height = height;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				drawGrid(ctx, gridSpacing);
			}
		}
	}, [gridSpacing, height, width]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				backgroundColor: 'transparent',
				zIndex: 60
			}}
		/>
	);
};

const drawGrid = (ctx: CanvasRenderingContext2D, spacing: number) => {
	const spacingSmall = spacing;
	const spacingLarge = spacing * 10;
	const data = `
		<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="smallGrid" width="${spacingSmall}" height="${spacingSmall}" patternUnits="userSpaceOnUse">
					<path d="M ${spacingSmall} 0 L 0 0 0 ${spacingSmall}" fill="none" stroke="gray" stroke-width="0.5" />
				</pattern>
				<pattern id="grid" width="${spacingLarge}" height="${spacingLarge}" patternUnits="userSpaceOnUse">
					<rect width="${spacingLarge}" height="${spacingLarge}" fill="url(#smallGrid)" />
					<path d="M ${spacingLarge} 0 L 0 0 0 ${spacingLarge}" fill="none" stroke="gray" stroke-width="1" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
	`;

	const img = new Image();
	const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(svg);

	img.onload = () => {
		ctx.drawImage(img, 0, 0);
		URL.revokeObjectURL(url);
	};
	img.src = url;
};

export default GridCanvas;