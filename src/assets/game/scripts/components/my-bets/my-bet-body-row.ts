import gc from "@sg/game-client-base";
import { _decorator, Color, Label, Node } from "cc";
import Observer from "observer";

import { DynamicObject } from "@sg/game-client-base/dist/game/bet-history";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { formatDate, formatTime } from "../../utils";


const { property, ccclass } = _decorator;
const { BetHistory, FormatUtils } = gc;
const { handle } = Observer;

export type BetResultHistoryBodyItemType = {
    betHistoryLog: gc.BetHistory.BetHistoryLog;
    index: number;
    betKey: number;
    fractionalOddsFormat?: boolean;
};

@ccclass
export default class MyBetBodyRow extends ObserverComponent {
    @property(Label)
    lblDate: Label = null;

    @property(Label)
    lblTime: Label = null;

    @property(Label)
    lblDateTime: Label = null;

    @property(Label)
    lblRound: Label = null;

    @property(Label)
    lblTotalStake: Label = null;

    @property(Label)
    lblMultiplier: Label = null;

    @property(Label)
    lblRefund: Label = null;

    @property(Node)
    nodeBackground: Node = null;

    @property(Label)
    lblResult: Label = null;

    @property(Node)
    betWinCell: Node = null;

    @property(Label)
    lblWin: Label = null;

    betHistoryLog: gc.BetHistory.BetHistoryLog = null;

    setData(data: BetResultHistoryBodyItemType) {
        const { betHistoryLog, index } = data;
        this.betHistoryLog = betHistoryLog;
        this.nodeBackground.active = index % 2 > 0;
        this.setLabels(betHistoryLog);
    }

    private getBetTime(betHistoryLog: gc.BetHistory.BetHistoryLog, betKey: number): string {
        return betHistoryLog.betLogDetails.find((element) => this.isBetRowData(element, betKey.toString()))?.time.toString();
    }

    private setLabels(betHistoryLog: gc.BetHistory.BetHistoryLog) {
        this.lblDate.string = formatDate(betHistoryLog.time);
        this.lblTime.string = formatTime(betHistoryLog.time);
        this.lblRound.string = betHistoryLog.roundId.toString();

        const totalAmount = this.getTotalAmountFromBetLogDetails(betHistoryLog);
        this.lblTotalStake.string = FormatUtils.numberWithCommas(totalAmount, 2);
        this.lblWin.string = FormatUtils.numberWithCommas(betHistoryLog.betwin, 2);
        if (betHistoryLog.betwin > 0) {
            this.lblWin.color = new Color().fromHEX("FFF600");
        }
    }

    private getBetAmount(betHistoryLog: gc.BetHistory.BetHistoryLog, betKey: number): number {
        const betDetail = betHistoryLog.betLogDetails.find((element) => this.isBetRowData(element, betKey.toString()));
        return betDetail === undefined ? 0 : Number(betDetail.amount);
    }

    public getTotalAmountFromBetLogDetails(betHistoryLog: gc.BetHistory.BetHistoryLog): number {
        return betHistoryLog.betLogDetails
            .filter((element) => this.isBetRowData(element, element.betKey.toString()))
            .reduce((total, betDetail) => total + Number(betDetail.amount), 0);
    }





    isBetRowData(betDetail: DynamicObject<object>, betKey: string): boolean {
        const actionName = betDetail.action.toString();
        return actionName === gc.GameClientEmitMessage.Bet.eventName.toString() && betDetail.betKey.toString() === betKey;
    }



    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @handle(gc.GameCrash.ProvablyFair.ProvablyFairHandler, (handle, roundId: number) => handle.openVerificationHistory(roundId))
    onClickVerify() {
        this.playSoundClick();
        return this.betHistoryLog.roundId;
    }

    @handle(BetHistory.BetDetailsHandlers)
    openTicketDetail() {
        this.playSoundClick();
        return this.betHistoryLog;
    }

    onLoad() {
        super.onLoad();
    }

}
