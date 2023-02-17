import type { Dispatch, MouseEventHandler, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';

type Props = {
	width: number;
	height: number;
	setMapCanvasRef: Dispatch<SetStateAction<HTMLCanvasElement | null>>;
	setMapCtxRef: Dispatch<SetStateAction<CanvasRenderingContext2D | null>>;
	handleMouseMove: MouseEventHandler<HTMLCanvasElement>;
	handleClick: MouseEventHandler<HTMLCanvasElement>;
};

const MapCanvas: React.FC<Props> = (
	{ width, height, setMapCanvasRef, setMapCtxRef, handleMouseMove, handleClick }
) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		console.log('in mapcanvas useeffect');
		const canvas = canvasRef.current;

		if (canvas) {
			canvas.width = width;
			canvas.height = height;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			setMapCanvasRef(canvas);
			const ctx = canvas.getContext('2d');

			if (ctx) {
				ctx.lineCap = 'round';
				ctx.lineWidth = 10;
				ctx.fillStyle = 'black';
				setMapCtxRef(ctx);
			}
		}

	}, [width, height, setMapCanvasRef, setMapCtxRef]);

	return (
		<canvas
			ref={canvasRef}
			onClick={handleClick}
			onMouseMove={handleMouseMove}
			style={{
				position: 'absolute',
				backgroundColor: 'transparent',
				zIndex: 70
			}}
		/>
	);
};

export default MapCanvas;