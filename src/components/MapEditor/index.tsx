import type { ChangeEvent, MouseEventHandler } from 'react';
import { useState } from 'react';
import MapCanvas from './MapCanvas';
import GridCanvas from './GridCanvas';
import MousePositionCanvas from './MousePositionCanvas';
import styles from './index.module.css';

export type Coordinates = {
	x: number;
	y: number;
};

export type Line = {
	start: Coordinates | null;
	end: Coordinates | null;
};

const MapEditor: React.FC = () => {
	const [mapCanvasRef, setMapCanvasRef] = useState<HTMLCanvasElement | null>(null);
	const [mapCtxRef, setMapCtxRef] = useState<CanvasRenderingContext2D | null>(null);

	const [width, setWidth] = useState<number>(500);
	const [height, setHeight] = useState<number>(500);
	const [gridSpacing, setGridSpacing] = useState<number>(10);

	const [mousePos, setMousePos] = useState<Coordinates>({ x: 0, y: 0 });
	const [isDrawingFrom, setIsDrawingFrom] = useState<Coordinates | null>(null);
	const [mapHistory, setMapHistory] = useState<string[]>([]);

	const getNearestSnapPos = () => ({
		x: Math.round(mousePos.x / gridSpacing) * gridSpacing,
		y: Math.round(mousePos.y / gridSpacing) * gridSpacing
	});

	const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (e) => {
		const rect = mapCanvasRef?.getBoundingClientRect();
		if (rect) {
			const { left, top } = rect;
			const mousePos: Coordinates = {
				x: e.clientX - Math.round(left),
				y: e.clientY - Math.round(top)
			};
			setMousePos(mousePos);
		}
	};

	const handleMapClick: MouseEventHandler<HTMLCanvasElement> = (e) => {
		if (isDrawingFrom !== null) {
			const canvas = e.target as HTMLCanvasElement;
			const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

			if (!mapHistory.length) {
				saveToHistory(canvas);
			}

			drawLine(ctx, { start: isDrawingFrom, end: getNearestSnapPos() });
			setIsDrawingFrom(null);
			saveToHistory(canvas);
		} else {
			setIsDrawingFrom(getNearestSnapPos());
		}
	};

	const handleUndo = () => {
		if (mapHistory.length > 1) {
			const ctx = mapCtxRef;
			const lastHistory = mapHistory[mapHistory.length - 2];
			if (ctx && lastHistory) {
				drawDataUrlToCanvas(ctx, lastHistory);
				setMapHistory((prevState) => prevState.slice(0, -1));
			}
		}
	};

	const drawDataUrlToCanvas = (ctx: CanvasRenderingContext2D, dataUrl: string) => {
		if (ctx && dataUrl) {
			const img = new Image();
			img.onload = () => {
				ctx.clearRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0);
			};
			img.src = dataUrl;
		}
	};

	const drawLine = (ctx: CanvasRenderingContext2D, line: Line) => {
		if (line.start && line.end) {
			ctx.beginPath();
			ctx.moveTo(line.start.x, line.start.y);
			ctx.lineTo(line.end.x, line.end.y);
			ctx.stroke();
		}
	};

	const clearMap = () => {
		if (mapCanvasRef && mapCtxRef) {
			mapCtxRef.clearRect(0, 0, width, height);
			saveToHistory(mapCanvasRef);
		}
	};

	const saveToHistory = (canvas: HTMLCanvasElement) => {
		const dataUrl = canvas.toDataURL();
		setMapHistory((prevState) => [...prevState, dataUrl]);
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
				<button type="button" className={styles.map_controls_button} onClick={handleUndo} disabled={mapHistory.length <= 1}>Undo</button>
			</div>

			<div className={styles.map_mouseCoordinates}>Coordinates: <strong>{getNearestSnapPos().x}</strong>, <strong>{getNearestSnapPos().y}</strong></div>

			<div className={styles.map_layerContainer} style={{ width, height }}>
				<MapCanvas width={width} height={height} setMapCanvasRef={setMapCanvasRef} setMapCtxRef={setMapCtxRef} handleMouseMove={handleMouseMove} handleClick={handleMapClick} />
				<GridCanvas width={width} height={height} gridSpacing={gridSpacing} />
				<MousePositionCanvas width={width} height={height} position={getNearestSnapPos()} isDrawingFrom={isDrawingFrom} />
			</div>
		</section>
	);
};

export default MapEditor;