import gc from "@sg/game-client-base";
import { _decorator, Button, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AudioIds } from "db://assets/game/audios/AudioIds";
import { InstantWinConfigStore } from "../../../game-configs/instant-win-config-store";
import { BetAmountHandlers } from "../bet-amount-handlers";
import { BetAmountStore } from "../bet-amount-store";
import BetLevelsContainer from "./bet-levels-container";
import { BetValueItem } from "./bet-value-item";

const { FormatUtils } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class BetAmount extends ObserverComponent {
    @property(Label)
    lblBetLevelDefault: Label = null;

    @property(Node)
    nodeDisabledDescrease: Node = null;

    @property(Node)
    nodeDisabledInscrease: Node = null;

    @property(Node)
    nodeOverlayBg: Node = null;

    @property(Node)
    nodeDisabledBetAmount: Node = null;

    @property(Button)
    btnHalfBet: Button = null;

    @property(Node)
    disabledHalfBet: Node = null;

    @property(Button)
    btnDoubleBet: Button = null;

    @property(Node)
    disabledDoubleBet: Node = null;

    @property(Node)
    nodeBetAmountValue: Node = null;

    private betAmount = 0;
    private betLevels = [];

    onLoad() {
        super.onLoad();
        this.nodeOverlayBg.active = false;
    }

    @render(InstantWinConfigStore, (store) => store.defaultBetLevel)
    showDefaultBetLevel(defaultBetLevel: number) {
        if (defaultBetLevel === undefined && this.betLevels.length > 0) {
            this.updateBetAmount(this.betLevels[0]);
        } else {
            this.updateBetAmount(defaultBetLevel);
        }
    }

    @handle(BetAmountHandlers, (handle, amount: number) => handle.updateBetAmount(amount))
    updateBetAmount(amount: number) {
        return amount;
    }

    @render(gc.Bet.BetStore, (store) => store.amount)
    renderBetAmount(betAmount: number) {
        this.setBetAmount(betAmount);
    }

    setBetAmount(betAmount: number) {
        this.lblBetLevelDefault.string = FormatUtils.numberWithCommas(betAmount, 2);
        this.betAmount = betAmount;
    }

    @render(BetAmountStore, (store) => store.betLevels)
    assignBetLevel(betLevels: number[]) {
        if (!betLevels) {
            return;
        }
        this.betLevels = betLevels;
        const betLevelsContainer = this.nodeBetAmountValue.getComponent(BetLevelsContainer);
        betLevelsContainer.setBetLevels(betLevels);
        console.log("betLevels", betLevels);
    }

    @handle(BetAmountHandlers, (handle, isOpen: boolean) => handle.updateStatusBetAmountPopup(isOpen))
    openBetAmountPopup(isOpen: boolean) {
        return isOpen;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(BetAmountHandlers, (handle) => handle.decreaseAmount())
    onClickDescreaseButton() {
        this.playSound(AudioIds.CLICK);
    }

    @handle(BetAmountHandlers, (handle) => handle.increaseAmount())
    onClickInscreaseButton() {
        this.playSound(AudioIds.CLICK);
    }

    @handle(BetAmountHandlers, (handler, data: { multiplier: number }) => handler.multiplyBetAmount(data.multiplier))
    onClickHalfBet() {
        this.playSound(AudioIds.CLICK);
        return {
            multiplier: 0.5,
        };
    }

    @handle(BetAmountHandlers, (handler, data: { multiplier: number }) => handler.multiplyBetAmount(data.multiplier))
    onClickDoubleBet() {
        this.playSound(AudioIds.CLICK);
        return {
            multiplier: 2,
        };
    }

    findIndexBetLevel(): number {
        return this.betLevels.findIndex((amount) => amount === this.betAmount);
    }

    onClickOverlayBg() {
        this.openBetAmountPopup(false);
    }

    @render(BetAmountStore, (store) => store.disabledBetAmount)
    disabledBetAmount(disabledBetAmount: boolean) {
        this.nodeDisabledBetAmount.active = disabledBetAmount;
    }

    @render(BetAmountStore, (store) => store.isMaxbetLevelValue || store.disabledBetAmount)
    disabledMaxBetLevel(disabled: boolean) {
        this.nodeDisabledInscrease.active = disabled;
        this.disabledDoubleBet.active = disabled;
    }

    @render(BetAmountStore, (store) => store.isMinBetLevelValue || store.disabledBetAmount)
    disabledMinBetLevel(disabled: boolean) {
        this.nodeDisabledDescrease.active = disabled;
        this.disabledHalfBet.active = disabled;
    }

    setActiveHalfBet(active: boolean) {
        this.btnHalfBet.interactable = active;
    }

    setActiveDoubleBet(active: boolean) {
        this.btnDoubleBet.interactable = active;
    }

    renderBetValue(betValue: number[]) {
       this.nodeBetAmountValue.children.forEach((child, index) => {
           const item = child.getComponent(BetValueItem);
           if (index < betValue.length) {
            item.setValue(betValue[index]);
           }
       });
    }
}
