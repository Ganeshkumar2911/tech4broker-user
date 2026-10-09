// Custom Klinecharts overlays for MT5-style Position line & SL/TP lines

export const positionLineOverlay = {
  name: 'positionLine',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    if (!coordinates || !coordinates.length || !coordinates[0]) return [];
    const { y } = coordinates[0];
    if (y === undefined || isNaN(y)) return [];

    const width = bounding.width;
    const extend = overlay.extendData || {};
    const isSell = Boolean(extend.isSell);
    const isPending = Boolean(extend.isPending);
    const orderType = String(extend.orderType || extend.side || '').toUpperCase();
    const isLimit = isPending || orderType.includes('LIMIT') || orderType.includes('STOP');
    const lineColor = isSell ? '#E5484D' : '#2563EB';

    let labelText = '';
    if (orderType.includes('LIMIT')) {
      labelText = isSell ? 'SELL LIMIT' : 'BUY LIMIT';
    } else if (orderType.includes('STOP')) {
      labelText = isSell ? 'SELL STOP' : 'BUY STOP';
    } else if (isLimit) {
      labelText = isSell ? 'SELL LIMIT' : 'BUY LIMIT';
    } else {
      labelText = isSell ? 'SELL' : 'BUY';
    }

    const price = extend.entryPrice || (overlay.points?.[0]?.value != null ? Number(overlay.points[0].value).toFixed(2) : '');
    const displayText = price ? `${labelText}  ${price}` : labelText;

    const figures = [
      // Horizontal line across chart canvas (Dashed for Buy Limit / Sell Limit, Solid for Open Positions)
      {
        type: 'line',
        attrs: {
          coordinates: [{ x: 0, y }, { x: width, y }]
        },
        styles: {
          style: isLimit ? 'dashed' : 'solid',
          dashedValue: [6, 4],
          color: lineColor,
          size: 1
        }
      }
    ];

    // For limit / pending orders, draw the clean text directly above the dashed line with NO background
    if (isLimit) {
      figures.push({
        type: 'text',
        attrs: {
          x: 4,
          y: y - 0.5,
          text: displayText,
          align: 'left',
          baseline: 'bottom'
        },
        styles: {
          color: lineColor,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          size: 8.5,
          weight: 'normal',
          family: 'sans-serif'
        }
      });
    }

    return figures;
  }
};

export const slTpLineOverlay = {
  name: 'slTpLine',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    if (!coordinates || !coordinates.length || !coordinates[0]) return [];
    const { y } = coordinates[0];
    if (y === undefined || isNaN(y)) return [];

    const width = bounding.width;
    const extend = overlay.extendData || {};
    const kind = (extend.kind || 'SL').toUpperCase();
    const isSl = kind === 'SL';
    const isDraft = Boolean(extend.isDraft);

    // Initial state: Grey (#9CA3AF / #6B7280)
    // Placed state: Red (#E5484D) for SL, Green (#0F946A) for TP
    const activeColor = isSl ? '#E5484D' : '#0F946A';
    const color = isDraft ? '#9CA3AF' : activeColor;

    return [
      // Dashed Draggable Horizontal line across chart canvas for SL/TP
      {
        type: 'line',
        attrs: {
          coordinates: [{ x: 0, y }, { x: width, y }]
        },
        styles: {
          style: 'dashed',
          dashedValue: [4, 4],
          color: color,
          size: 1.5
        }
      }
    ];
  }
};
