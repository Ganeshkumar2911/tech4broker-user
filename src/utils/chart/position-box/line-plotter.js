/**
 * @param {object}   chart       - klinecharts instance
 * @param {object}   position    - { id, price, pnl, pnlPercent }
 * @param {Function} onClose     - called when ✕ is clicked, receives position id
 */
export function plotPriceLine(chart, position, onClose) {
    const { id, entry_price: price } = position

    chart.createOverlay({
        name: 'positionLine',
        id: `positionLine_${id}`,
        lock: true,
        ignoreEvent: false,
        points: [{ value: price }],

        extendData: {
            pnl: 0,
            pnlPercent: 0,
            boxX: 0,
            boxY: 0
        },

        onClick({ overlay, x, y }) {
            const boxX = overlay?.extendData?.boxX ?? 0
            const boxYCenter = overlay?.extendData?.boxY ?? y ?? 0

            const BOX_WIDTH = 140
            const BOX_HEIGHT = 28
            const CLOSE_BTN_SIZE = 16

            const closeX = boxX + BOX_WIDTH - CLOSE_BTN_SIZE - 6
            const boxY = boxYCenter - BOX_HEIGHT / 2

            const onCloseBtn =
                x >= closeX &&
                x <= closeX + CLOSE_BTN_SIZE &&
                y >= boxY &&
                y <= boxY + BOX_HEIGHT

            if (onCloseBtn) {
                onClose?.(id)
            }
        }
    })
}

/**
 * Remove a position line by id
 */
export function removePriceLine(chart, id) {
    chart.removeOverlay(`positionLine_${id}`)
}
