import { registerOverlay } from 'klinecharts'

/**
 * Call once at app startup (before any chart.createOverlay).
 * The overlay uses 'positionBox' figure registered above.
 */
export function registerPositionLineOverlay() {
    registerOverlay({
        name: 'positionLine',

        // Already complete the moment it is created — no user drawing steps
        totalStep: 1,

        needDefaultPointFigure: false,
        needDefaultXAxisFigure: false,
        needDefaultYAxisFigure: false,

        /**
         * params.coordinates[0].y  — pixel Y for our price point (auto-converted by klinecharts)
         * params.overlay.extendData — { pnl, pnlPercent, onClose }
         * params.bounding           — chart bounding box, gives us x=0 left edge
         */
        createPointFigures({ coordinates, overlay, bounding }) {
            if (!coordinates.length) return []

            const { pnl = 0, pnlPercent = 0 } = overlay.extendData ?? {}
            const y = coordinates[0].y
            const x = bounding.left ?? 0   // pin to left edge of pane

            overlay.extendData = {
                ...(overlay.extendData ?? {}),
                boxX: x,
                boxY: y
            }

            return [
                {
                    key: 'positionBox',
                    type: 'positionBox',   // our registered figure name
                    attrs: { x, y, pnl, pnlPercent },
                    // Do NOT ignoreEvent — we need clicks
                    ignoreEvent: false
                }
            ]
        }
    })
}
