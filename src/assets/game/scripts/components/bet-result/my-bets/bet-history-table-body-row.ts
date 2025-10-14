import gc from "@sg/game-client-base";
import { _decorator, Button, Color, Label, Node } from "cc";
import Observer from "observer";

import { DynamicObject } from "@sg/game-client-base/dist/game/bet-history";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AppUtils } from "db://shared-components/shared/utils/app-utils";
import { CrashUtils } from "../../../crash-utils";
import { HistoryConstants } from "../../../handlers/crash-v2";
import { BetHistoryLog } from "../../../handlers/crash-v2/bet/crash-bet-history-store";
import { BetWinCell } from "./bet-win-cell";

const { property, ccclass } = _decorator;
const { DateTimeUtils, FormatUtils } = gc;
const { BetHistory } = gc;
const { handle } = Observer;

export type BetResultHistoryBodyItemType = {
    betHistoryLog: BetHistoryLog;
    index: number;
    betKey: number;
    fractionalOddsFormat?: boolean;
};

@ccclass
export default class BetHistoryTableBodyRow extends ObserverComponent {
    @property(Label)
    lblDate: Label = null;

    @property(Label)
    lblTime: Label = null;

    @property(Label)
    lblRound: Label = null;

    @property(Label)
    lblTotalStake: Label = null;

    @property(Label)
    lblWin: Label = null;

    @property(Button)
    btnRound: Button = null;

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

    betHistoryLog: BetHistoryLog = null;

    setData(data: BetResultHistoryBodyItemType) {
        const { betHistoryLog, index } = data;
        this.betHistoryLog = betHistoryLog;
        this.nodeBackground.active = index % 2 > 0;
        this.setLabels(betHistoryLog);
    }

    private getBetTime(betHistoryLog: BetHistoryLog, betKey: number): string {
        return betHistoryLog.betLogDetails.find((element) => this.isBetRowData(element, betKey.toString()))?.time.toString();
    }

    private setLabels(betHistoryLog: BetHistoryLog) {
        this.lblDate.string = CrashUtils.formatDate(betHistoryLog.time);
        this.lblTime.string = CrashUtils.formatTime(betHistoryLog.time);
        this.lblRound.string = betHistoryLog.roundId.toString();

        const totalAmount = betHistoryLog.totalAmount;
        this.lblTotalStake.string = FormatUtils.numberWithCommas(totalAmount, 2);
        this.lblWin.string = FormatUtils.numberWithCommas(betHistoryLog.betWin, 2);
        if (betHistoryLog.betWin > 0) {
            this.lblWin.color = new Color().fromHEX("FFF600");
        }
    }

    private getBetAmount(betHistoryLog: BetHistoryLog, betKey: number): number {
        const betDetail = betHistoryLog.betLogDetails.find((element) => this.isBetRowData(element, betKey.toString()));
        return betDetail === undefined ? 0 : Number(betDetail.amount);
    }

    public getTotalAmountFromBetLogDetails(betHistoryLog: BetHistoryLog): number {
        return betHistoryLog.betLogDetails
            .filter((element) => this.isBetRowData(element, element.betKey.toString()))
            .reduce((total, betDetail) => total + Number(betDetail.amount), 0);
    }

    private bindMultiplier(betHistoryLog: BetHistoryLog, betKey: number) {
        const multiplierRow = betHistoryLog.betLogDetails.find((element) => this.isSettledData(element, betKey.toString()));
        const defaultMultiplierText = "-";

        if (!multiplierRow) {
            this.lblMultiplier.string = defaultMultiplierText;
            return;
        }

        const isRefund = multiplierRow.action.toString() === CrashUtils.betEventNames.refund;
        if (isRefund) {
            this.lblRefund.node.active = true;
            this.lblMultiplier.node.active = false;
            return;
        }

        const multiplier = Number(multiplierRow.multiplier);
        const multiplierText = multiplier !== 0 ? `${FormatUtils.numberWithCommas(multiplier, 2, false)}x` : defaultMultiplierText;

        this.lblMultiplier.string = multiplierText;
    }

    private bindWin(betHistoryLog: BetHistoryLog, betKey: number) {
        const betCashOut = betHistoryLog.betLogDetails.find((element) => this.isSettledData(element, betKey.toString()));

        const isReachMaxWin = Boolean(betCashOut?.reachMaxWin);
        const betwin = betCashOut === undefined ? 0 : Number(betCashOut.winAmount);
        const win = FormatUtils.numberWithCommas(betwin, 2);

        this.betWinCell.getComponent(BetWinCell)?.setData(win, isReachMaxWin);
        if (isReachMaxWin) {
            this.setupEventListeners();
        }
    }

    isBetRowData(betDetail: DynamicObject<object>, betKey: string): boolean {
        const actionName = betDetail.action.toString();
        return actionName === gc.GameClientEmitMessage.Bet.eventName.toString() && betDetail.betKey.toString() === betKey;
    }

    isSettledData(betDetail: DynamicObject<object>, betKey: string): boolean {
        const actionName = betDetail.action.toString();
        return (
            (actionName === CrashUtils.betEventNames.cashOut || actionName === CrashUtils.betEventNames.refund) &&
            betDetail.betKey.toString() === betKey
        );
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @handle(gc.GameCrash.ProvablyFair.ProvablyFairHandler, (handle, roundId: number) => {
        console.log("Handler called with roundId:", roundId);
        return handle.openVerificationHistory(roundId);
    })
    onClickVerify() {
        this.playSoundClick();
        return this.betHistoryLog.roundId;
    }

    @handle(BetHistory.BetDetailsHandlers)
    openTicketDetail() {
        this.playSoundClick();
        console.log("openTicketDetail", this.betHistoryLog);
        return this.betHistoryLog;
    }

    @handle(gc.BetDetailsNew.BetDetailsHandler, (handler, payload: any) => handler.openBetDetails(payload))
    openBetDetails() {
        this.playSoundClick();
        return {
            roundId: this.betHistoryLog.roundId,
            mode: "dark",
            language: AppUtils.getLocale() || AppUtils.DEFAULT_LOCALE,
            timeZoneOffset: -new Date().getTimezoneOffset() / 60,
        };
    }

    onLoad() {
        super.onLoad();
    }

    private setupEventListeners() {
        this.betWinCell.on(Node.EventType.MOUSE_ENTER, this.triggerHoverMaxReachCallback, this);
        this.betWinCell.on(Node.EventType.MOUSE_LEAVE, this.triggerExitHoverMaxReachCallback, this);
        this.betWinCell.on(Node.EventType.TOUCH_START, this.triggerHoverMaxReachCallback, this);
        this.betWinCell.on(Node.EventType.TOUCH_END, this.triggerTouchEndMaxReachCallback, this);
    }

    triggerHoverMaxReachCallback() {
        this.node.emit(HistoryConstants.hoverTriggerParent, this.node);
    }

    triggerExitHoverMaxReachCallback() {
        this.node.emit(HistoryConstants.exitHoverTriggerParent, this.node);
    }

    triggerTouchEndMaxReachCallback() {
        setTimeout(() => {
            this.triggerExitHoverMaxReachCallback();
        }, 2000);
    }
}
