import styles from './create.module.css';
import type { NextPage } from 'next';
import Head from 'next/head';
import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

type Coordinates = {
	x: number;
	y: number;
};

type Line = {
	start: Coordinates | null;
	end: Coordinates | null;
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
	const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const gridCtxRef = useRef<CanvasRenderingContext2D | null>(null);

	const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const mapCtxRef = useRef<CanvasRenderingContext2D | null>(null);

	const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);

	const [width, setWidth] = useState<number>(500);
	const [height, setHeight] = useState<number>(500);

	const [gridSpacing, setGridSpacing] = useState<number>(10);

	const [mousePos, setMousePos] = useState<Coordinates>({ x: 0, y: 0 });
	const [nearestSnapPos, setNearestSnapPos] = useState<Coordinates>({ x: 0, y: 0 });

	const [currentLine, setCurrentLine] = useState<Line>({ start: null, end: null });


	useEffect(() => {
		const gridCanvas = gridCanvasRef.current;
		const mapCanvas = mapCanvasRef.current;
		const overlayCanvas = overlayCanvasRef.current;

		if (gridCanvas && mapCanvas && overlayCanvas) {
			[gridCanvas, mapCanvas, overlayCanvas].forEach((canvas) => {
				canvas.width = width;
				canvas.height = height;
				canvas.style.width = `${width}px`;
				canvas.style.height = `${height}px`;
			});

			const [gridCanvasCtx, mapCanvasCtx, overlayCanvasCtx] = [gridCanvas, mapCanvas, overlayCanvas].map(canvas => canvas.getContext('2d'));

			if (gridCanvasCtx && mapCanvasCtx && overlayCanvasCtx) {
				[gridCanvasCtx, mapCanvasCtx, overlayCanvasCtx].forEach(ctx => {
					ctx.lineCap = 'round';
					ctx.lineWidth = 10;
					ctx.fillStyle = 'black';
				});

				overlayCanvasCtx.strokeStyle = 'red';

				gridCtxRef.current = gridCanvasCtx;
				mapCtxRef.current = mapCanvasCtx;
				overlayCtxRef.current = overlayCanvasCtx;
			}

			mapCanvas.addEventListener('mousemove', handleMouseMove);
		}

		return () => {
			if (mapCanvas) {
				mapCanvas.removeEventListener('mousemove', handleMouseMove);
			}
		};
	}, [width, height]);

	useEffect(() => {
		const gridCanvasCtx = gridCtxRef.current;

		if (gridCanvasCtx) {
			gridCanvasCtx.clearRect(0, 0, width, height);
			drawGrid(gridCanvasCtx, gridSpacing);
		}
	}, [width, height, gridSpacing]);

	useEffect(() => {
		const snapIntervalX = gridSpacing;
		const snapIntervalY = gridSpacing;
		const { x, y } = mousePos;
		const snapPosX = Math.round(x / snapIntervalX) * snapIntervalX;
		const snapPosY = Math.round(y / snapIntervalY) * snapIntervalY;

		setNearestSnapPos({ x: snapPosX, y: snapPosY });

	}, [mousePos, gridSpacing]);

	useEffect(() => {
		const overlayCtx = overlayCtxRef.current;

		if (overlayCtx) {
			overlayCtx.clearRect(0, 0, width, height);
			if (currentLine.start === null) {
				drawCircle(overlayCtx, nearestSnapPos.x, nearestSnapPos.y, 5);
			} else {
				drawLine(overlayCtx, { start: currentLine.start, end: nearestSnapPos });
			}
		}

	}, [currentLine, nearestSnapPos, width, height]);

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

	const handleMapClick = () => {
		const isDrawing = currentLine.start !== null;
		setCurrentLine({
			start: isDrawing ? currentLine.start : nearestSnapPos,
			end: isDrawing ? nearestSnapPos : null
		});
	};

	useEffect(() => {
		const ctx = mapCtxRef.current;
		if (ctx && currentLine.end !== null) {
			drawLine(ctx, currentLine);
			setCurrentLine({ start: null, end: null });
		}
	}, [currentLine]);

	const drawLine = (ctx: CanvasRenderingContext2D, line: Line) => {
		if (line.start && line.end) {
			ctx.beginPath();
			ctx.moveTo(line.start.x, line.start.y);
			ctx.lineTo(line.end.x, line.end.y);
			ctx.stroke();
		}
	};

	const clearMap = () => {
		if (mapCtxRef.current) {
			mapCtxRef.current.clearRect(0, 0, width, height);
		}
	};

	return (
		<section className={styles.map}>
			<header className={styles.map_header}>
				Name:
				<span className={styles.map_name}>My Map</span>
			</header>

			<div className={styles.map_controls}>
				<label htmlFor="width" className={styles.map_controls_label}>
					Map Width
					<input
						className={styles.map_controls_input}
						style={{ width: '4em' }}
						type="number"
						value={width}
						step="10"
						min="100"
						onChange={
							(e: ChangeEvent<HTMLInputElement>) => {
								setWidth(Number(e.target.value));
							}
						} />
				</label>
				<label htmlFor="height" className={styles.map_controls_label}>
					Map Height
					<input
						className={styles.map_controls_input}
						style={{ width: '4em' }}
						type="number"
						value={height}
						step="10"
						min="100"
						onChange={
							(e: ChangeEvent<HTMLInputElement>) => {
								setHeight(Number(e.target.value));
							}
						} />
				</label>
				<label htmlFor="gridSpacing" className={styles.map_controls_label}>
					Grid Spacing
					<input
						className={styles.map_controls_input}
						style={{ width: '3em' }}
						type="number"
						value={gridSpacing}
						step="10"
						min="10"
						onChange={
							(e: ChangeEvent<HTMLInputElement>) => {
								setGridSpacing(Number(e.target.value));
							}
						} />
				</label>
			</div>

			<div className={styles.map_controls}>
				<button type="button" className={styles.map_controls_button} onClick={clearMap}>Clear Map</button>
			</div>

			<div className={styles.map_mouseCoordinates}>Coordinates: <strong>{nearestSnapPos.x}</strong>, <strong>{nearestSnapPos.y}</strong></div>

			<div className={styles.map_layerContainer} style={{ width, height }}>
				<canvas className={styles.map_layer} ref={mapCanvasRef} style={{ zIndex: 70 }} onClick={handleMapClick} />
				<canvas className={styles.map_layer} ref={gridCanvasRef} style={{ zIndex: 60 }} />
				<canvas className={styles.map_layer} ref={overlayCanvasRef} style={{ zIndex: 50, backgroundColor: '#FFF' }} />
			</div>
		</section>
	);
};

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, d: number) => {
	ctx.beginPath();
	ctx.arc(x, y, d, 0, Math.PI * 2);
	ctx.fill();
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