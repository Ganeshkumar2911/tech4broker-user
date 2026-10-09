import { registerIndicator } from "klinecharts";
import { customMa } from "./customMA";
import { smaSignal } from "./sma";
import { bbiIndicator } from "./bbi";
import { emaSignal } from "./ema";
import { TVTest } from "./TV_test";
import { Donchian } from "./Donchian";
import { DonchianTriple } from "./DonchianTriple";
import { Bollinger } from "./bollinger";
import { PivotPoints } from "./pivot";
import { PivotMix } from "./pivotMix";
import { Supertrend } from "./supertrend";
import { MultiIndicator } from './MultiIndicator';
import { PivotSupertrend } from './TwoIndicator';
import { SmaDonchianMerged } from './SmaDonchianMerged';

registerIndicator(customMa);
registerIndicator(smaSignal);
registerIndicator(bbiIndicator);
registerIndicator(emaSignal);
registerIndicator(TVTest);
registerIndicator(Donchian);
registerIndicator(DonchianTriple);
registerIndicator(Bollinger);
registerIndicator(PivotPoints);
registerIndicator(PivotMix);
registerIndicator(Supertrend)
// registerIndicator(MultiIndicator)
registerIndicator(PivotSupertrend)
registerIndicator(SmaDonchianMerged)

export default [
  customMa,
  smaSignal,
  bbiIndicator,
  emaSignal,
  TVTest,
  Donchian,
  DonchianTriple,
  Bollinger,
  PivotPoints,
  PivotMix,
  Supertrend,
  // MultiIndicator,
  PivotSupertrend,
  SmaDonchianMerged
]