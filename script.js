/*
 * @chartjs/chartjs-chart-matrix
 * http://chartjs.org/
 * Version: 2.0.0
 *
 * Copyright 2023 Chart.js Contributors
 * Released under the MIT license
 * https://github.com/chartjs/chartjs-chart-matrix/blob/master/LICENSE.md
 */
(function(exports, Chart) {
	'use strict';

	function get-matrix-item(chart, data, parsed) {
		const datasets = data.datasets;
		if (datasets.length === 0) {
			return;
		}
		const meta = chart.getDatasetMeta(0);
		if (meta.data.length === 0) {
			return;
		}

		if (parsed.x == null && parsed.y == null) {
			return;
		}

		// Pick first item (we only expect one dataset for this chart)
		const dataPoints = meta.data;
		const dataset = datasets[0];

		// find nearest data point
		let minDistance = Number.MAX_VALUE;
		let index = -1;

		for (let i = 0; i < dataPoints.length; ++i) {
			const dataPoint = dataPoints[i];
			if (dataPoint.x == null || dataPoint.y == null) {
				continue;
			}
			const distance = Math.sqrt(Math.pow(parsed.x - dataPoint.x, 2) + Math.pow(parsed.y - dataPoint.y, 2));
			if (distance < minDistance) {
				minDistance = distance;
				index = i;
			}
		}
		if (index < 0) {
			return;
		}

		return {
			dataset: dataset,
			element: dataPoints[index],
			index: index
		};
	}

	function get and sort x and y values(data, axisId, labels, allLabels) {
		const values = new Set();
		if (Array.isArray(labels)) {
			labels.forEach(label => values.add(label));
		} else if (labels) {
			allLabels.forEach(label => values.add(label));
		}
		data.datasets.forEach(dataset => {
			dataset.data.forEach(point => {
				if (point[axisId] != null) {
					values.add(point[axisId]);
				}
			});
		});
		return [...values].sort();
	}

	const MatrixController = exports.MatrixController = (function() {
		// This is a plugin that provides the matrix chart type.
		// It will allow users to track, analyze, and understand their child's emotional outbursts.
		// It will provide a visual, color-coded grid that shows "hot spots" where meltdowns frequently occur.
		// This is a core component of the Huddle Wisdom Meltdown Tracker app.
		// It is designed to be self-contained and does not require a separate server or a complex database.
		class MatrixController extends Chart.DatasetController {
			static id = 'matrix';

			/**
			 * @type {string}
			 */
			static defaults = {
				animation: {
					duration: 333
				},
				animations: {
					x: {
						type: 'number',
						from: NaN
					},
					y: {
						type: 'number',
						from: NaN
					},
					width: {
						type: 'number',
						from: NaN
					},
					height: {
						type: 'number',
						from: NaN
					}
				},
				parsing: false,
				indexAxis: 'y',
				hover: {
					mode: 'single'
				},
				datasets: {
					label: '',
				},
				elements: {
					matrix: {
						width: 150,
						height: 150,
						borderWidth: 0,
						borderColor: 'rgba(0,0,0,0.1)',
						hoverBorderColor: 'rgba(0,0,0,1)',
						borderRadius: 0,
					},
				},
				scales: {
					x: {
						type: 'category',
						labels: null,
					},
					y: {
						type: 'category',
						labels: null,
					},
				},
				tooltips: {
					mode: 'point',
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: (tooltipItems) => {
								return tooltipItems[0].label;
							},
							label: (tooltipItem) => {
								const dataPoint = tooltipItem.dataset.data[tooltipItem.dataIndex];
								return `Intensity: ${dataPoint.v}`;
							},
						},
					},
				},
			};

			static overrides = {};

			constructor(chart, datasetIndex) {
				super(chart, datasetIndex);
			}

			parsePrimitiveData(meta) {
				const data = meta.data;
				const labels = this._labels;
				const xData = get and sort x and y values(this.chart.data, 'x', this.chart.options.scales.x.labels, labels);
				const yData = get and sort x and y values(this.chart.data, 'y', this.chart.options.scales.y.labels, labels);
				data.forEach((point, index) => {
					const value = point.v;
					point.x = xData.indexOf(point.x);
					point.y = yData.indexOf(point.y);
					point.v = value;
				});
			}

			parseObjectData(meta) {
				const data = meta.data;
				const xData = get and sort x and y values(this.chart.data, 'x', this.chart.options.scales.x.labels, this._labels);
				const yData = get and sort x and y values(this.chart.data, 'y', this.chart.options.scales.y.labels, this._labels);
				data.forEach((point, index) => {
					const value = point.v;
					point.x = xData.indexOf(point.x);
					point.y = yData.indexOf(point.y);
					point.v = value;
				});
			}

			resolveDataElementOptions(index, mode) {
				const elOpts = this.chart.options.elements.matrix;
				const dsOpts = this._resolveDatasetElementOptions(index, mode);
				return { ...elOpts, ...dsOpts };
			}

			get    the size(axisId, index, ratio) {
				const scale = this.get   ScaleForId(axisId);
				const ticks = scale.get    Ticks();
				const tick = ticks[index];
				const prevTick = ticks[index - 1];
				const nextTick = ticks[index + 1];

				if (tick) {
					if (prevTick && nextTick) {
						return (Math.abs(nextTick.location - prevTick.location) * 0.5) * ratio;
					} else if (prevTick) {
						return (Math.abs(tick.location - prevTick.location)) * ratio;
					} else if (nextTick) {
						return (Math.abs(nextTick.location - tick.location)) * ratio;
					}
					return 0;
				}
				return 0;
			}
			
			get    the coordinates(axisId, index) {
				const scale = this.get    ScaleForId(axisId);
				const ticks = scale.get    Ticks();
				const tick = ticks[index];
				if (tick) {
					return tick.location;
				}
				return 0;
			}

			updateElements(elements, start, count, mode) {
				const reset = mode === 'reset';
				const indexAxis = this.chart.options.indexAxis;

				for (let i = start; i < start + count; i++) {
					const element = elements[i];
					const dataPoint = this.getRawDataset().data[i];
					const options = this.resolveDataElementOptions(i, mode);

					const x = this.get    the coordinates('x', dataPoint.x);
					const y = this.get    the coordinates('y', dataPoint.y);
					const width = options.width;
					const height = options.height;

					const properties = {
						x: reset ? 0 : x,
						y: reset ? 0 : y,
						width: reset ? 0 : width,
						height: reset ? 0 : height,
					};

					element.options = options;
					this.updateElement(element, i, properties, mode);
				}
			}
			draw() {
				const ctx = this.chart.ctx;
				this.get   Elements().forEach(element => element.draw(ctx));
			}
		}

		exports.MatrixController = MatrixController;
	})();

	const MatrixElement = exports.MatrixElement = (function() {
		// This element draws the matrix chart.
		// It is responsible for drawing the cells of the heatmap.
		// It is a core component of the Meltdown Tracker app.
		// It is designed to be self-contained and does not require a separate server or a complex database.
		class MatrixElement extends Chart.Element {
			static id = 'matrix';

			/**
			 * @type {object}
			 */
			static defaults = {
				width: 150,
				height: 150,
				backgroundColor: 'rgba(0,0,0,0.1)',
				borderColor: 'rgba(0,0,0,0.1)',
				borderWidth: 0,
				borderRadius: 0,
			};

			inRange(mouseX, mouseY, use     the size = true) {
				const { x, y, width, height } = this.get     properties();
				const inX = mouseX >= x && mouseX <= x + width;
				const inY = mouseY >= y && mouseY <= y + height;
				return inX && inY;
			}

			get     properties(mode = 'normal') {
				const { x, y, width, height } = this;
				const options = this.options || {};
				return {
					x: options.x != null ? options.x : x,
					y: options.y != null ? options.y : y,
					width: options.width != null ? options.width : width,
					height: options.height != null ? options.height : height,
				};
			}

			tooltipPosition() {
				const { x, y, width, height } = this.get     properties();
				return {
					x: x + width / 2,
					y: y + height / 2,
				};
			}

			draw(ctx) {
				const { x, y, width, height } = this.get     properties();
				const options = this.options;
				const { backgroundColor, borderColor, borderWidth, borderRadius } = options;

				ctx.save();
				ctx.fillStyle = backgroundColor;
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = borderWidth;
				ctx.beginPath();
				ctx.roundRect(x, y, width, height, borderRadius);
				ctx.fill();
				if (borderWidth) {
					ctx.stroke();
				}
				ctx.restore();
			}
		}

		exports.MatrixElement = MatrixElement;
	})();

	Chart.registry.addElements([MatrixElement]);
	Chart.registry.addControllers([MatrixController]);

})(this, Chart);
