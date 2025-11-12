import gc from "@sg/game-client-base";
import { _decorator, Label, Node, Tween, tween, Vec3 } from "cc";
import { startGame } from "db://shared-components/shared/scripts/startup";
import Observer from "observer";

import { BalanceEffectHandlers } from "db://shared-components/game/balance-effect/scripts/handlers/balance-effect-handlers";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import { siteConfigs } from "../../../scripts/site-configs";
import { AudioIds } from "../../audios/AudioIds";
import { containerOptions } from "../containerOptions";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../game-configs/instant-win-config-store";
import { settings } from "../game-settings";
import { InterruptionHandlers } from "../interruption-handlers";
import "./../../../resources/i18n";
import { BetHandler } from "./bets/bet-handler";
import { BetStore, SettleStatus } from "./bets/bet-store";
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

    @render(BetStore, (store) => store.settleStatus)
    async renderSettleStatus(settleStatus: SettleStatus) {
        const { bigWinNotice, normalWinNotice, crashAnimation, winAnimation, stepAnimation, winAllStepAnimation } = settings.durations;
        if (!settleStatus || Object.keys(settleStatus).length === 0) {
            return;
        }

        if (!settleStatus.win) {
            this.scheduleOnce(() => {
                this.completeSettle();
            }, crashAnimation);

            return;
        }

        const isBigWin = settleStatus.isBigWin;

        const node = this.nodeWinNotice.getChildByName(isBigWin ? "big" : "normal");
        let duration = isBigWin ? bigWinNotice : normalWinNotice;

        const maxMultiplier = this._currentMultiplierConfig.multiplierSteps.at(-1);
        const isWinAllStep = this.multiplier === maxMultiplier;
        if (isWinAllStep) {
            duration = winAllStepAnimation;
        }

        const winNotice = node.getComponentInChildren(GameWinNotice);
        isBigWin ? this.playSound(AudioIds.BIGWIN) : this.playSound(AudioIds.NORMALWIN);
        let showWinNoticeDuration = duration;
        if (isWinAllStep) {
            const delayShowWinDuration = winAnimation + stepAnimation;
            showWinNoticeDuration = winAllStepAnimation - delayShowWinDuration;
            await AnimationUtils.delayTime(delayShowWinDuration);
        }
        winNotice?.show(settleStatus.bet, showWinNoticeDuration);

        this.mainPlayerIncreaseBalance(settleStatus.bet);
        this.mainPlayerPlayWinningEffect();
        this.getBalance();

        this.addCashOutHistory();

        this.scheduleOnce(() => {
            this.completeSettle();
        }, duration);
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig)
    renderCurrentMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        this._currentMultiplierConfig = currentMultiplierConfig;
    }

    @render(BetStore, (store) => store.multiplier)
    renderMultiplier(multiplier: number) {
        this.multiplier = multiplier;
    }

    @handle(AutoPlayHandler, (handle) => handle.checkAutoBetNextRound())
    @handle(BetHandler, (handler) => handler.completeSettle())
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

    shake(node: Node, duration = 1, strength = 10) {
        const originalPosition = new Vec3(node.position);
        const shakes: Tween<any>[] = [];
        const steps = Math.floor(duration / 0.02);

        for (let i = 0; i < steps; i++) {
            const offsetX = (Math.random() - 0.5) * strength * 2;
            const offsetY = (Math.random() - 0.5) * strength * 2;
            shakes.push(tween(node).to(0.02, { position: new Vec3(offsetX, offsetY, 0).add(originalPosition) }));
        }

        shakes.push(tween(node).to(0.02, { position: originalPosition }));

        tween(node)
            .sequence(...shakes)
            .start();
    }
}
