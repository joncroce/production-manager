import { useEffect, useRef } from 'react';
import type { Coordinates } from '.';

type Props = {
	width: number;
	height: number;
	position: Coordinates;
	isDrawingFrom: Coordinates | null;
};

const MousePositionCanvas: React.FC<Props> = ({ width, height, position, isDrawingFrom }) => {
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
				if (isDrawingFrom === null) {
					drawPositionMarker(ctx, position.x, position.y);
				} else {
					ctx.lineCap = 'round';
					ctx.lineWidth = 10;
					ctx.strokeStyle = 'red';
					ctx.beginPath();
					ctx.moveTo(isDrawingFrom.x, isDrawingFrom.y);
					ctx.lineTo(position.x, position.y);
					ctx.stroke();
				}
			}
		}
	}, [width, height, position, isDrawingFrom]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				backgroundColor: '#FFF',
				zIndex: 50
			}}
		/>
	);
};

const drawPositionMarker = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
	ctx.beginPath();
	ctx.arc(x, y, 5, 0, Math.PI * 2);
	ctx.fill();
};

export default MousePositionCanvas;