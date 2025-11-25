import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";

import { BalanceEffectHandlers } from "db://shared-components/game/balance-effect/scripts/handlers/balance-effect-handlers";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { siteConfigs } from "../../../scripts/site-configs";
import { AudioIds } from "../../audios/AudioIds";
import { containerOptions } from "../containerOptions";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../game-configs/instant-win-config-store";
import { settings } from "../game-settings";
import { InterruptionHandlers } from "../interruption-handlers";
import "./../../../resources/i18n";
import { BetStore, BetUIState, SettleStatus } from "./bets/bet-store";
import { CashOutHistoryHandlers } from "./cash-out-history/cash-out-history-handlers";
import { GameWinNotice } from "./game-win-notice";
import { AutoPlayHandler } from "./play-mode/auto-play/auto-play-handler";

startGame(settings.name, containerOptions, siteConfigs, settings.namespaces);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

export interface IWinInstantResult {
    betWin: number;
    bigWin: true;
}

@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ type: Label, visible: false, override: true })
    lblMinBet: Label = null;

    @property({ type: Label, visible: false, override: true })
    lblMaxBet: Label = null;

    @property(Node)
    nodeWinNotice: Node = null;

    @property(Node)
    centerNode: Node = null;

    override namespace = settings.name;
    override containerOptions = containerOptions;
    private multiplier = 0;
    private _currentMultiplierConfig: FixedStepsMultiplierConfig = null;
    private uiState: BetUIState = BetUIState.Start;

    @render(BetStore, (store) => store.roundId)
    renderlblRound(roundId: number) {
        this.lblRoundId && roundId !== 0 && (this.lblRoundId.string = `#${roundId}`);
    }

    override renderRoundId(roundId: number) {
        // override to not use round id from round store
    }

    override onShowGame() {
        this.handleGameShow();
    }

    override onHideGame() {
        this.handleGameHide();
    }

    @handle(InterruptionHandlers, (handler) => handler.onGameHide())
    handleGameHide() { }

    @handle(InterruptionHandlers, (handler) => handler.onGameShow())
    handleGameShow() { }

    @render(BetStore, (store) => store.uiState)
    renderUiState(uiState: BetUIState) {
        this.uiState = uiState;
        console.log("renderUiState ", uiState);
    }

    @render(BetStore, (store) => store.eventSettleStatus, { fireImmediately: false })
    async renderSettleStatus(eventSettleStatus: { settleStatus: SettleStatus }) {
        const { settleStatus } = eventSettleStatus;
        const { bigWinNotice, normalWinNotice } = settings.durations;
        if (!settleStatus || Object.keys(settleStatus).length === 0) {
            return;
        }

        if (!settleStatus.win) {
            this.completeSettle();
            return;
        }

        const isBigWin = settleStatus.isBigWin;
        const node = this.nodeWinNotice.getChildByName(isBigWin ? "big" : "normal");
        const winNoticeDuration = isBigWin ? bigWinNotice : normalWinNotice;

        const winNotice = node.getComponentInChildren(GameWinNotice);
        this.playSound(AudioIds.BIGWIN);
        winNotice?.show(settleStatus.bet, winNoticeDuration);

        this.mainPlayerIncreaseBalance(settleStatus.bet);
        this.mainPlayerPlayWinningEffect();
        this.getBalance();

        this.addCashOutHistory();

        this.scheduleOnce(() => {
            this.completeSettle();
        }, winNoticeDuration);
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig)
    renderCurrentMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        this._currentMultiplierConfig = currentMultiplierConfig;
    }

    @render(BetStore, (store) => store.multiplier)
    renderMultiplier(multiplier: number) {
        this.multiplier = multiplier;
    }

    @handle(AutoPlayHandler, (handler) => handler.completeSettle())
    completeSettle() { }

    @handle(gc.Auth.AuthHandlers.GetBalance)
    getBalance() { }

    @handle(BalanceEffectHandlers.MainPlayerIncreaseBalance)
    mainPlayerIncreaseBalance(balance: number) {
        return balance;
    }

    @handle(BalanceEffectHandlers.MainPlayerWinEffect)
    mainPlayerPlayWinningEffect() {
        return true;
    }

    @handle(CashOutHistoryHandlers, (handler) => handler.addCashOutHistory())
    addCashOutHistory() { }
}
