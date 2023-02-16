import styles from './create.module.css';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';

type Coordinates = {
	x: number;
	y: number;
};

const CreateMapPage: NextPage = () => {

	return (
		<>
			<Head>
				<title>Create New Map</title>
			</Head>
			<main className={styles.main}>
				<header className={styles.main_header}>Create New Map</header>
				<Canvas />
			</main>
		</>
	);
};

export default CreateMapPage;

const Canvas: React.FC = () => {
	const width = 500;
	const height = 500;

	const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const gridCtxRef = useRef<CanvasRenderingContext2D | null>(null);

	const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);

	useEffect(() => {
		const gridCanvas = gridCanvasRef.current;

		if (gridCanvas) {
			gridCanvas.width = width;
			gridCanvas.height = height;
			gridCanvas.style.width = `${width}px`;
			gridCanvas.style.height = `${height}px`;
			const gridCtx = gridCanvas.getContext('2d');

			if (gridCtx) {
				gridCtx.lineCap = 'square';
				gridCtx.lineWidth = 10;
				drawGrid(gridCtx, 100);
				gridCtxRef.current = gridCtx;
			}

			gridCanvas.addEventListener('mousemove', handleMouseMove);
		}

		const overlayCanvas = overlayCanvasRef.current;

		if (overlayCanvas) {
			overlayCanvas.width = width;
			overlayCanvas.height = height;
			overlayCanvas.style.width = `${width}px`;
			overlayCanvas.style.height = `${height}px`;
			const overlayCtx = overlayCanvas.getContext('2d');

			if (overlayCtx) {
				overlayCtx.fillStyle = 'black';
				overlayCtxRef.current = overlayCtx;
			}
		}

		return () => {
			if (gridCanvas) {
				gridCanvas.removeEventListener('mousemove', handleMouseMove);
			}
		};
	}, []);

	const [mousePos, setMousePos] = useState<Coordinates>({ x: 0, y: 0 });
	const [nearestSnapPos, setNearestSnapPos] = useState<Coordinates>({ x: 0, y: 0 });

	useEffect(() => {
		const snapIntervalX = 10;
		const snapIntervalY = 10;
		const { x, y } = mousePos;
		const snapPosX = Math.round(x / snapIntervalX) * snapIntervalX;
		const snapPosY = Math.round(y / snapIntervalY) * snapIntervalY;

		setNearestSnapPos({ x: snapPosX, y: snapPosY });

	}, [mousePos]);

	useEffect(() => {
		const overlayCtx = overlayCtxRef.current;

		if (overlayCtx) {
			overlayCtx.clearRect(0, 0, width, width);
			drawCircle(overlayCtx, nearestSnapPos.x, nearestSnapPos.y, width / 100);
		}

	}, [nearestSnapPos]);

	const handleMouseMove = (e: MouseEvent) => {
		const rect = gridCanvasRef.current?.getBoundingClientRect();
		if (rect) {
			const { left, top } = rect;

			setMousePos({
				x: e.clientX - Math.round(left),
				y: e.clientY - Math.round(top)
			});
		}
	};

	return (
		<section className={styles.map}>
			<header className={styles.map_header}>
				Name:
				<span className={styles.map_name}>My Map</span>
			</header>

			<pre>Actual: {JSON.stringify(mousePos, undefined, 2)}</pre>
			<pre>Snap: {JSON.stringify(nearestSnapPos, undefined, 2)}</pre>

			<div className={styles.map_layerContainer} style={{ width }}>

				<canvas className={styles.map_layer} ref={gridCanvasRef} style={{ zIndex: 60 }} />
				<canvas className={styles.map_layer} ref={overlayCanvasRef} style={{ zIndex: 50 }} />
			</div>
		</section>
	);
};

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, d: number) => {
	ctx.beginPath();
	ctx.ellipse(x, y, d, d, 0, 0, Math.PI * 2);
	ctx.fill();
};

const drawGrid = (ctx: CanvasRenderingContext2D, width: number) => {
	const data = `
		<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern id="smallGrid" width="${width / 10}" height="${width / 10}" patternUnits="userSpaceOnUse">
					<path d="M ${width / 10} 0 L 0 0 0 ${width / 10}" fill="none" stroke="gray" stroke-width="0.5" />
				</pattern>
				<pattern id="grid" width="${width}" height="${width}" patternUnits="userSpaceOnUse">
					<rect width="${width}" height="${width}" fill="url(#smallGrid)" />
					<path d="M ${width} 0 L 0 0 0 ${width}" fill="none" stroke="gray" stroke-width="1" />
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