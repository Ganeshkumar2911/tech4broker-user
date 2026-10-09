import horizontalStraightLine from './horizontalStraightLine.vue'
import horizontalRayLine from './horizontalRayLine.vue'
import horizontalSegment from './horizontalSegment.vue'
import verticalStraightLine from './verticalStraightLine.vue'
import verticalRayLine from './verticalRayLine.vue'
import verticalSegment from './verticalSegment.vue'
import straightLine from './straightLine.vue'
import rayLine from './rayLine.vue'
import segment from './segment.vue'
import arrow from './arrow.vue'
import priceLine from './priceLine.vue'
import priceChannelLine from './priceChannelLine.vue'
import parallelStraightLine from './parallelStraightLine.vue'
import fibonacciLine from './fibonacciLine.vue'
import fibonacciSegment from './fibonacciSegment.vue'
import fibonacciCircle from './fibonacciCircle.vue'
import fibonacciSpiral from './fibonacciSpiral.vue'
import fibonacciSpeedResistanceFan from './fibonacciSpeedResistanceFan.vue'
import fibonacciExtension from './fibonacciExtension.vue'
import gannBox from './gannBox.vue'
import circle from './circle.vue'
import triangle from './triangle.vue'
import rect from './rect.vue'
import parallelogram from './parallelogram.vue'
import threeWaves from './threeWaves.vue'
import fiveWaves from './fiveWaves.vue'
import eightWaves from './eightWaves.vue'
import anyWaves from './anyWaves.vue'
import abcd from './abcd.vue'
import xabcd from './xabcd.vue'

import weakMagnet from './weakMagnet.vue'
import strongMagnet from './strongMagnet.vue'

import visible from './visible.vue'
import invisible from './invisible.vue'

import lock from './lock.vue'
import unlock from './unlock.vue'

import remove from './remove.vue'

export const Icon = {
  horizontalStraightLine,
  horizontalRayLine,
  horizontalSegment,
  verticalStraightLine,
  verticalRayLine,
  verticalSegment,
  straightLine,
  rayLine,
  segment,
  arrow,
  priceLine,
  priceChannelLine,
  parallelStraightLine,
  fibonacciLine,
  fibonacciSegment,
  fibonacciCircle,
  fibonacciSpiral,
  fibonacciSpeedResistanceFan,
  fibonacciExtension,
  gannBox,
  circle,
  circleIcon: circle,
  triangle,
  rect,
  rectIcon: rect,
  parallelogram,
  threeWaves,
  fiveWaves,
  eightWaves,
  anyWaves,
  abcd,
  xabcd,
  weak_magnet: weakMagnet,
  strong_magnet: strongMagnet,
  lock,
  unlock,
  visible,
  invisible,
  remove
}

export default (app) => {
  // Icons here
  app.component('horizontalStraightLine', horizontalStraightLine)
  app.component('horizontalRayLine', horizontalRayLine)
  app.component('horizontalSegment', horizontalSegment)
  app.component('verticalStraightLine', verticalStraightLine)
  app.component('verticalRayLine', verticalRayLine)
  app.component('verticalSegment', verticalSegment)
  app.component('straightLine', straightLine)
  app.component('rayLine', rayLine)
  app.component('segment', segment)
  app.component('arrow', arrow)
  app.component('priceLine', priceLine)
  app.component('priceChannelLine', priceChannelLine)
  app.component('parallelStraightLine', parallelStraightLine)
  app.component('fibonacciLine', fibonacciLine)
  app.component('fibonacciSegment', fibonacciSegment)
  app.component('fibonacciCircle', fibonacciCircle)
  app.component('fibonacciSpiral', fibonacciSpiral)
  app.component('fibonacciSpeedResistanceFan', fibonacciSpeedResistanceFan)
  app.component('fibonacciExtension', fibonacciExtension)
  app.component('gannBox', gannBox)
  app.component('circleIcon', circle)
  app.component('triangle', triangle)
  app.component('rectIcon', rect)
  app.component('parallelogram', parallelogram)
  app.component('threeWaves', threeWaves)
  app.component('fiveWaves', fiveWaves)
  app.component('eightWaves', eightWaves)
  app.component('anyWaves', anyWaves)
  app.component('abcd', abcd)
  app.component('xabcd', xabcd)
  app.component('weakMagnet', weakMagnet)
  app.component('strongMagnet', strongMagnet)
  app.component('lock', lock)
  app.component('unlock', unlock)
  app.component('visible', visible)
  app.component('invisible', invisible)
  app.component('remove', remove)


}