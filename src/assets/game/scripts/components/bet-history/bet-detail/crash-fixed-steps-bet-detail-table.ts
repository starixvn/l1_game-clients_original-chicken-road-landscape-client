import gc from "@sg/game-client-base";
import { _decorator, Color, Label, Prefab } from "cc";

import { CrashGameBetDetailLogTable } from "db://shared-components/game-crash/bet-history-details/scripts/crash-game-bet-detail-log-table";
import Observer from "observer";
import { BetHistoryLog } from "../../../handlers/crash-v2/bet/crash-bet-history-store";
import { HashHandlers } from "../../hash/hash-handlers";
const { FormatUtils } = gc;

const { handle } = Observer;
const { ccclass, property } = _decorator;
interface IBetDetailLog {
    amount: number;
    winAmount: number;
    multiplier: number | null;
    time: string | null;
    action: string;
}

@ccclass
export class CrashFixedStepsBetDetailTable extends CrashGameBetDetailLogTable {

    @property(Label)
    lblTotalStake: Label = null;

    @property(Label)
    lblWin: Label = null;

    @property(Label)
    lblWinLoss: Label = null;

    betHistoryLog: BetHistoryLog = null;

    @handle(HashHandlers, (handle, roundId: number) => handle.openVerificationHistory(roundId))
    onClickVerify() {
        this.playSoundClick();
        return this.betHistoryLog.roundId;
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    playSoundClick() { }

    showBetDetail(bodyItemPrefab: Prefab, model: gc.BetHistory.BetDetailModel) {
        const { fractionalOddsFormat, betHistoryLog } = model;
        this.betHistoryLog = betHistoryLog as unknown as BetHistoryLog;
        const reachMaxWin = this.betHistoryLog.reachMaxWin;
        this.cpnReachMaxWin.node.active = reachMaxWin;
        if (reachMaxWin) {
            this.cpnReachMaxWin.lblReachMaxWin.string = FormatUtils.numberWithCommas(this.betHistoryLog.totalAmount, 2);
        }

        const totalAmount = this.betHistoryLog.totalAmount;
        const winLoss = this.betHistoryLog.betWin - totalAmount;
        this.lblTotalStake.string = FormatUtils.numberWithCommas(totalAmount, 2);
        this.lblWinLoss.string = FormatUtils.numberWithCommas(winLoss, 2);
        this.lblWin.string = FormatUtils.numberWithCommas(this.betHistoryLog.betWin, 2);

        if (this.betHistoryLog.betWin > 0) {
            this.lblWin.color = new Color().fromHEX("FFF600");
            this.lblWinLoss.color = new Color().fromHEX("FFF600");
        }

        this.body.addChild(
            this.buildBodyRow(bodyItemPrefab, {
                betDetailsLog: this.betHistoryLog as unknown as gc.BetHistory.DynamicObject<object>,
                index: 0,
                odds: this.betHistoryLog.odds,
                settlementResult: this.betHistoryLog.settlementResult,
                result: this.betHistoryLog.result,
                freeBet: this.betHistoryLog.freeBet,
                fractionalOddsFormat: fractionalOddsFormat,
            })
        );
    }
}
