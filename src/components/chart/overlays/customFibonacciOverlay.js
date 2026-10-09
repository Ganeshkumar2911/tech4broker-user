export const defaultFibonacciSettings = {
  trendLine: true,
  background: true,
  reverse: false,
  opacity: 0.15,
  levels: [
    { value: 0, active: true, color: '#787B86' },
    { value: 0.236, active: true, color: '#F23645' },
    { value: 0.382, active: true, color: '#FF9800' },
    { value: 0.5, active: true, color: '#4CAF50' },
    { value: 0.618, active: true, color: '#089981' },
    { value: 0.786, active: true, color: '#00BCD4' },
    { value: 1, active: true, color: '#787B86' },
    { value: 1.272, active: false, color: '#FF9800' },
    { value: 1.414, active: false, color: '#F23645' },
    { value: 1.618, active: true, color: '#2962FF' },
    { value: 2.618, active: true, color: '#E91E63' },
    { value: 3.618, active: true, color: '#9C27B0' },
    { value: 4.236, active: true, color: '#E91E63' },
  ]
};

export const customFibonacciOverlay = {
  name: 'customFibonacciLine',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    const points = overlay.points;
    if (coordinates.length < 2) return [];

    const config = overlay.extendData || defaultFibonacciSettings;
    const activeLevels = config.levels.filter(l => l.active);

    const startX = 0;
    const endX = bounding.width;
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    
    const yDif = p1.y - p2.y;
    const valueDif = (points[0].value || 0) - (points[1].value || 0);

    const figures = [];

    if (config.background && activeLevels.length >= 2) {
      const minVal = Math.min(...activeLevels.map(l => l.value));
      const maxVal = Math.max(...activeLevels.map(l => l.value));
      
      const percentMin = config.reverse ? (1 - minVal) : minVal;
      const percentMax = config.reverse ? (1 - maxVal) : maxVal;

      const yMin = p2.y + yDif * percentMin;
      const yMax = p2.y + yDif * percentMax;

      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: startX, y: yMin },
            { x: endX, y: yMin },
            { x: endX, y: yMax },
            { x: startX, y: yMax }
          ]
        },
        styles: {
          style: 'fill',
          color: `rgba(41, 98, 255, ${config.opacity})`
        },
        ignoreEvent: true
      });
    }

    if (config.trendLine) {
      figures.push({
        type: 'line',
        attrs: {
          coordinates: [p1, p2]
        },
        styles: {
          style: 'dashed',
          color: '#787B86',
          size: 1,
          dashedValue: [4, 4]
        }
      });
    }

    activeLevels.forEach(levelObj => {
      const percent = config.reverse ? (1 - levelObj.value) : levelObj.value;
      const y = p2.y + yDif * percent;
      const priceValue = ((points[1].value || 0) + valueDif * percent).toFixed(2);

      figures.push({
        type: 'line',
        attrs: {
          coordinates: [{ x: startX, y }, { x: endX, y }]
        },
        styles: {
          style: 'solid',
          color: levelObj.color,
          size: 1
        }
      });

      figures.push({
        type: 'text',
        attrs: {
          x: startX + 5,
          y: y - 4,
          text: `${levelObj.value} (${priceValue})`,
          align: 'left',
          baseline: 'bottom'
        },
        styles: {
          color: levelObj.color,
          size: 12
        }
      });
    });

    return figures;
  }
};
