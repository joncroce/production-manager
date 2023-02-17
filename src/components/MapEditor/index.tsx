import type { ChangeEvent, MouseEventHandler } from 'react';
import { useState } from 'react';
import MapCanvas from './MapCanvas';
import GridCanvas from './GridCanvas';
import MousePositionCanvas from './MousePositionCanvas';
import TankIcon from './TankIcon';
import LineIcon from './LineIcon';
import styles from './index.module.css';

export type Coordinates = {
	x: number;
	y: number;
};

export type Line = {
	start: Coordinates | null;
	end: Coordinates | null;
};

type MapHistoryEntry = {
	dataUrl: string;
	tankLocations: Coordinates[];
};

const MapEditor: React.FC = () => {
	const [width, setWidth] = useState<number>(500);
	const [height, setHeight] = useState<number>(500);
	const [gridSpacing, setGridSpacing] = useState<number>(10);
	const [drawingMode, setDrawingMode] = useState<'line' | 'tank'>('line');

	const [mapCanvas, setMapCanvas] = useState<HTMLCanvasElement | null>(null);
	const [mousePos, setMousePos] = useState<Coordinates>({ x: 0, y: 0 });
	const [isDrawingFrom, setIsDrawingFrom] = useState<Coordinates | null>(null);
	const [mapHistory, setMapHistory] = useState<MapHistoryEntry[]>([]);
	const [tankLocations, setTankLocations] = useState<Coordinates[]>([]);

	const getNearestSnapPos = () => ({
		x: Math.round(mousePos.x / gridSpacing) * gridSpacing,
		y: Math.round(mousePos.y / gridSpacing) * gridSpacing
	});

	const getMapCtx = () => mapCanvas?.getContext('2d');

	const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (e) => {
		const rect = mapCanvas?.getBoundingClientRect();
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
		const canvas = e.target as HTMLCanvasElement;
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

		if (isDrawingFrom !== null) {

			if (!mapHistory.length) {
				saveToHistory(canvas);
			}

			drawLine(ctx, { start: isDrawingFrom, end: getNearestSnapPos() });
			setIsDrawingFrom(null);
			saveToHistory(canvas);
		} else if (drawingMode === 'tank') {
			drawTank(getNearestSnapPos());
		} else {
			setIsDrawingFrom(getNearestSnapPos());
		}
	};

	const handleUndo = () => {
		if (mapHistory.length > 1) {
			const ctx = getMapCtx();
			const lastHistory = mapHistory[mapHistory.length - 2];
			if (ctx && lastHistory) {
				drawDataUrlToCanvas(ctx, lastHistory.dataUrl);
				setTankLocations(lastHistory.tankLocations);
				setMapHistory((prevState) => prevState.slice(0, -1));
			}
		}
	};

	const drawTank = (position: Coordinates) => {
		const size = 40;
		const data = `
			<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g>
					<circle cx="12" cy="12" r="11" fill="#D9D9D9" stroke="black" stroke-width="2" />
					<line x1="12" y1="20" x2="12" y2="8" stroke="black" stroke-width="2" />
					<line x1="5" y1="7" x2="19" y2="7" stroke="black" stroke-width="2" />
				</g>
			</svg>
		`;

		const img = new Image();
		const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svg);

		img.onload = () => {
			getMapCtx()?.drawImage(img, position.x - size / 2, position.y - size / 2);
			URL.revokeObjectURL(url);
			setTankLocations((prevState) => [...prevState, position]);
			saveToHistory();
		};
		img.src = url;
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
		if (mapCanvas) {
			getMapCtx()?.clearRect(0, 0, width, height);
			saveToHistory(mapCanvas);
			setTankLocations([]);
		}
	};

	const saveToHistory = (canvas: HTMLCanvasElement | null = mapCanvas) => {
		const dataUrl = canvas?.toDataURL();
		if (dataUrl) {
			setMapHistory((prevState) => [...prevState, { dataUrl, tankLocations }]);
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
				<button type="button" className={styles.map_controls_button} onClick={handleUndo} disabled={mapHistory.length <= 1}>Undo</button>
			</div>

			<div className={styles.map_controls}>
				<button
					data-current-mode={drawingMode === 'line'}
					type="button"
					className={styles.map_controls_iconButton}
					onClick={() => setDrawingMode('line')}
				>
					Draw Line
					<LineIcon />
				</button>
				<button
					data-current-mode={drawingMode === 'tank'}
					type="button"
					className={styles.map_controls_iconButton}
					onClick={
						() => {
							setDrawingMode('tank');
							setIsDrawingFrom(null);
						}
					}>
					Place Tank
					<TankIcon />
				</button>
			</div>

			<div className={styles.map_mouseCoordinates}>Coordinates: <strong>{getNearestSnapPos().x}</strong>, <strong>{getNearestSnapPos().y}</strong></div>

			<div className={styles.map_layerContainer} style={{ width, height }}>
				<MapCanvas width={width} height={height} setMapCanvas={setMapCanvas} handleMouseMove={handleMouseMove} handleClick={handleMapClick} />
				<GridCanvas width={width} height={height} gridSpacing={gridSpacing} />
				<MousePositionCanvas width={width} height={height} position={getNearestSnapPos()} isDrawingFrom={isDrawingFrom} />
			</div>

			<div className={styles.map_tanks}>
				<header className={styles.map_tanks_header}>Tank Locations</header>
				<ol className={styles.map_tanks_list}>
					{tankLocations.map((location, i) => (
						<li className={styles.map_tanks_list_item} key={`${i}-${location.x},${location.y}`}>
							<span className={styles.map_tanks_list_item_coordinates}>{location.x}, {location.y}</span>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
};

export default MapEditor;