import { registerOverlay } from 'klinecharts'

import arrow from './arrow'
import circle from './circle'
import rect from './rect'
import parallelogram from './parallelogram'
import triangle from './triangle'
import fibonacciCircle from './fibonacciCircle'
import fibonacciSegment from './fibonacciSegment'
import fibonacciSpiral from './fibonacciSpiral'
import fibonacciSpeedResistanceFan from './fibonacciSpeedResistanceFan'
import fibonacciExtension from './fibonacciExtension'
import gannBox from './gannBox'
import threeWaves from './threeWaves'
import fiveWaves from './fiveWaves'
import eightWaves from './eightWaves'
import anyWaves from './anyWaves'
import abcd from './abcd'
import xabcd from './xabcd'

const overlays = [
  arrow,
  circle, rect, triangle, parallelogram,
  fibonacciCircle, fibonacciSegment, fibonacciSpiral,
  fibonacciSpeedResistanceFan, fibonacciExtension, gannBox,
  threeWaves, fiveWaves, eightWaves, anyWaves, abcd, xabcd
]


overlays.forEach(overlay => {
  registerOverlay(overlay)
})

const singleLineOptions = [
  { icon: 'horizontalStraightLine', key: 'horizontalStraightLine', text: 'horizontal_straight_line' },
  { icon: 'horizontalRayLine', key: 'horizontalRayLine', text: 'horizontal_ray_line' },
  { icon: 'horizontalSegment', key: 'horizontalSegment', text: 'horizontal_segment' },
  { icon: 'verticalStraightLine', key: 'verticalStraightLine', text: 'vertical_straight_line' },
  { icon: 'verticalRayLine', key: 'verticalRayLine', text: 'vertical_ray_line' },
  { icon: 'verticalSegment', key: 'verticalSegment', text: 'vertical_segment' },
  { icon: 'straightLine', key: 'straightLine', text: 'straight_line' },
  { icon: 'rayLine', key: 'rayLine', text: 'ray_line' },
  { icon: 'segment', key: 'segment', text: 'segment' },
  { icon: 'arrow', key: 'arrow', text: 'arrow' },
  { icon: 'priceLine', key: 'priceLine', text: 'price_line' }
]

const moreLineOptions = [
  { icon: 'priceChannelLine', key: 'priceChannelLine', text: 'price_channel_line' },
  { icon: 'parallelStraightLine', key: 'parallelStraightLine', text: 'parallel_straight_line' }
]

const polygonOptions = [
  { icon: 'circleIcon', key: 'circle', text: 'circle' },
  { icon: 'rectIcon', key: 'rect', text: 'rect' },
  { icon: 'parallelogram', key: 'parallelogram', text: 'parallelogram' },
  { icon: 'triangle', key: 'triangle', text: 'triangle' }
]

const fibonacciOptions = [
  { icon: 'fibonacciLine', key: 'fibonacciLine', text: 'fibonacci_line' },
  { icon: 'fibonacciSegment', key: 'fibonacciSegment', text: 'fibonacci_segment' },
  { icon: 'fibonacciCircle', key: 'fibonacciCircle', text: 'fibonacci_circle' },
  { icon: 'fibonacciSpiral', key: 'fibonacciSpiral', text: 'fibonacci_spiral' },
  { icon: 'fibonacciSpeedResistanceFan', key: 'fibonacciSpeedResistanceFan', text: 'fibonacci_speed_resistance_fan' },
  { icon: 'fibonacciExtension', key: 'fibonacciExtension', text: 'fibonacci_extension' },
  { icon: 'gannBox', key: 'gannBox', text: 'gann_box' }
]

const waveOptions = [
  { icon: 'xabcd', key: 'xabcd', text: 'xabcd' },
  { icon: 'abcd', key: 'abcd', text: 'abcd' },
  { icon: 'threeWaves', key: 'threeWaves', text: 'three_waves' },
  { icon: 'fiveWaves', key: 'fiveWaves', text: 'five_waves' },
  { icon: 'eightWaves', key: 'eightWaves', text: 'eight_waves' },
  { icon: 'anyWaves', key: 'anyWaves', text: 'any_waves' },
]


const magnetOptions = [
  { icon: 'weakMagnet', key: 'weak_magnet', text: 'weak_magnet' },
  { icon: 'strong_magnet', key: 'strong_magnet', text: 'strong_magnet' }
]

export const allOverlays = [ 
  { id: 1, show: false, icon: 'horizontalStraightLine', text: 'single line', options: singleLineOptions },
  { id: 2, show: false, icon: 'priceChannelLine', text: 'more line', options: moreLineOptions },
  { id: 3, show: false, icon: 'circleIcon', text: 'polygon', options: polygonOptions },
  { id: 4, show: false, icon: 'fibonacciLine', text: 'fibonacci', options: fibonacciOptions },
  { id: 5, show: false, icon: 'xabcd', text: 'wave', options: waveOptions }
]
