import { registerFigure } from 'klinecharts'

// Box dimensions — tweak to taste
const BOX_WIDTH = 140
const BOX_HEIGHT = 28
const BOX_PADDING_X = 10
const CLOSE_BTN_SIZE = 16
const BORDER_RADIUS = 4

export function registerPositionBoxFigure() {
    registerFigure({
        name: 'positionBox',

        /**
         * attrs shape:
         * {
         *   x: number,         // left edge of box (pixel)
         *   y: number,         // vertical center (pixel, = price Y)
         *   pnl: number,       // e.g. +320.50
         *   pnlPercent: number // e.g. +1.42
         * }
         */
        draw(ctx, attrs) {
            const { x, y, pnl = 0, pnlPercent = 0 } = attrs

            const isProfit = pnl >= 0
            const bgColor = isProfit ? '#0f5132' : '#58151c'
            const lineColor = isProfit ? '#20c997' : '#f1416c'
            const textColor = '#ffffff'

            const boxX = x
            const boxY = y - BOX_HEIGHT / 2
            const closeX = boxX + BOX_WIDTH - CLOSE_BTN_SIZE - 6

            // 1. Horizontal price line — full width, behind the box
            ctx.save()
            ctx.beginPath()
            ctx.setLineDash([4, 3])
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 1
            // draw rightward from box edge (leftward portion drawn by chart bg)
            ctx.moveTo(x, y)
            ctx.lineTo(x + 2000, y)   // extend to the right edge
            ctx.stroke()
            ctx.restore()

            // 2. Left accent bar
            ctx.save()
            ctx.fillStyle = lineColor
            ctx.fillRect(boxX, boxY, 3, BOX_HEIGHT)
            ctx.restore()

            // 3. Main box background (rounded)
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(boxX + 3, boxY, BOX_WIDTH - 3, BOX_HEIGHT, BORDER_RADIUS)
            ctx.fillStyle = bgColor
            ctx.fill()
            ctx.restore()

            // 4. PnL text
            const sign = isProfit ? '+' : ''
            const label = `${sign}${pnl.toFixed(2)}  (${sign}${pnlPercent.toFixed(2)}%)`

            ctx.save()
            ctx.font = 'bold 11px Inter, sans-serif'
            ctx.fillStyle = textColor
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'left'
            ctx.fillText(label, boxX + 3 + BOX_PADDING_X, y, BOX_WIDTH - CLOSE_BTN_SIZE - BOX_PADDING_X - 16)
            ctx.restore()

            // 5. Close button (×)
            ctx.save()
            ctx.font = 'bold 12px sans-serif'
            ctx.fillStyle = '#aaaaaa'
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center'
            ctx.fillText('✕', closeX + CLOSE_BTN_SIZE / 2, y)
            ctx.restore()
        },

        /**
         * checkEventOn — determines what was clicked.
         * Return true for the whole box area so onClick fires.
         * We'll distinguish close-btn vs box in the overlay's onClick handler.
         */
        checkEventOn(coordinate, attrs) {
            const { x, y } = attrs
            const boxY = y - BOX_HEIGHT / 2

            return (
                coordinate.x >= x &&
                coordinate.x <= x + BOX_WIDTH &&
                coordinate.y >= boxY &&
                coordinate.y <= boxY + BOX_HEIGHT
            )
        }
    })
}

// Helper — was the click on the ✕ button area?
export function isCloseButtonClick(coordinate, attrs) {
    const { x, y } = attrs
    const closeX = x + BOX_WIDTH - CLOSE_BTN_SIZE - 6
    const boxY = y - BOX_HEIGHT / 2

    return (
        coordinate.x >= closeX &&
        coordinate.x <= closeX + CLOSE_BTN_SIZE &&
        coordinate.y >= boxY &&
        coordinate.y <= boxY + BOX_HEIGHT
    )
}