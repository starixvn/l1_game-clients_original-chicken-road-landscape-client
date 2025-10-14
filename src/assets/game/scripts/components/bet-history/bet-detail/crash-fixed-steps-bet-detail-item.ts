import gc from "@sg/game-client-base";
import { _decorator, Color, Label } from "cc";


import { BaseBetDetailLogItem, BetDetailLogItemType } from "db://shared-components/game/bet-history/scripts/components/bet-detail/bet-detail-log-item";
import { CrashUtils } from "../../../crash-utils";
const { ccclass, property } = _decorator;
const { FormatUtils } = gc;

export interface CrashGameBetDetailsLog {
    amount: number;
    time: string;
    action: string;
    rate: number;
    rebet: boolean;
    multiplier: number;
    betWin: number;
    totalAmount: number;
}

@ccclass
export class CrashFixedStepsBetDetailItem extends BaseBetDetailLogItem {
    @property(Label)
    lblMultiplier: Label = null;

    @property(Label)
    lblBet: Label = null;

    @property(Label)
    lblRefund: Label = null;

    setData(data: BetDetailLogItemType) {
        const { totalAmount, multiplier, betWin, time } = data.betDetailsLog as CrashGameBetDetailsLog &
            gc.BetHistory.DynamicObject<object>;

        this.nodeBackground.active = data.index % 2 === 0;
        this.lblTime.string = CrashUtils.formatTime(time);
        this.lblBet.string = FormatUtils.numberWithCommas(totalAmount, 2);
        this.lblMultiplier.string = multiplier ? `${FormatUtils.numberWithCommas(multiplier, 2, false)}x` : "-";
        this.lblWin.string = FormatUtils.numberWithCommas(betWin, 2);
        this.setHighlightTicketDetail(betWin > 0);
    }

    setHighlightTicketDetail(highlight: boolean) {
        const color = highlight ? Color.YELLOW : new Color().fromHEX('#B3BEC1');
        this.lblWin.color = color;
    }
}
