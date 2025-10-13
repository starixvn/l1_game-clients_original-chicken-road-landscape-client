import gc from "@sg/game-client-base";
import { _decorator, Color, Prefab } from "cc";
import { BetHistoryNewBodyItem } from "db://shared-components/game/bet-history-new/scripts/bet-history-new-body-item";
import Observer from "observer";
import { HashHandlers } from "../hash/hash-handlers";

const { ccclass, property } = _decorator;
const { DateTimeUtils, FormatUtils } = gc;
const { handle } = Observer;

export type BetHistoryBodyItemType = {
    betHistoryLog: gc.BetHistory.BetHistoryLog & {
        multiplier: number;
    };
    index: number;
    resultPrefab: Prefab | null;
};

@ccclass("instant_win_bet_history_body_item")
export class InstantWinBetHistoryBodyItem extends BetHistoryNewBodyItem {


    setData(data: BetHistoryBodyItemType) {
        const { betwin } = data.betHistoryLog;
        super.setData(data);
        this.lblWin.color = betwin > 0 ? new Color().fromHEX("F1E344") : new Color().fromHEX("ffffff");

    }

    @handle(HashHandlers, (handle, roundId: number) => handle.openVerificationHistory(roundId))
    onClickVerifyProvablyFair() {
        this.playSoundClick();
        return this.betHistoryLog.roundId;
    }
}
