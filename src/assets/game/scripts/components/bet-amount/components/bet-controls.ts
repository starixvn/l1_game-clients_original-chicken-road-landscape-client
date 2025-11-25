import gc from "@sg/game-client-base";
import { _decorator, Button, EditBox, Node, warn } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AudioIds } from "db://assets/game/audios/AudioIds";
import { InstantWinConfigStore } from "../../../game-configs/instant-win-config-store";
import { BetHandler } from "../../bets/bet-handler";
import { AutoPlayStore } from "../../play-mode/auto-play";
import { BetAmountHandlers } from "../bet-amount-handlers";
import { BetAmountStore } from "../bet-amount-store";

const { FormatUtils } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class BetControls extends ObserverComponent {
    @property(Node)
    nodeDisabledDescrease: Node = null;

    @property(Node)
    nodeDisabledInscrease: Node = null;

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

    @property(EditBox)
    inputBetAmount: EditBox = null;

    private defaultBetLevel = 0;

    onLoad() {
        this.inputBetAmount.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEndBetAmount, this);
        this.inputBetAmount.node.on(EditBox.EventType.EDITING_DID_BEGAN, this.onEditBegin, this);

        super.onLoad();
    }

    onEditBegin(editBox: EditBox) {
        this.triggerEventEditBox('Begin', editBox.node);
        this.triggerClickEventEditBox();
        const text = editBox.string;
        const cleanText = text.replace(/,/g, "").replace(/x/g, "");
        const numValue = Number(cleanText);
        editBox.string = numValue.toString();
        editBox.placeholder = numValue.toString();
    }

    @handle(AutoPlayStore, handler => handler.triggerClickEvent('EditBox'))
    triggerClickEventEditBox() { }

    @handle(BetHandler, (handler, data: { name: string, node: Node }) => handler.triggerEditBoxEvent(data))
    triggerEventEditBox(name: string, node: Node) {
        return { name, node }
    }

    onEditEndBetAmount(editBox: EditBox) {
        const validValue = this.onEditEnd(editBox, false);
        const validAmount = Math.max(validValue, this.defaultBetLevel);
        this.updateBetAmount(Number(validAmount));
        this.setInputAmountKey("editBox");
    }

    @handle(BetAmountHandlers, (handle, key: string) => handle.setInputAmountKey(key))
    setInputAmountKey(key: string) {
        return key;
    }

    onEditEnd(editBox: EditBox, noZero: boolean) {
        try {
            let value = Number(editBox.string);
            if (isNaN(value)) {
                value = this.defaultBetLevel;
            }
            const valueString = gc.FormatUtils.numberWithCommas(value, 2, noZero);
            const validValue = valueString.replace(/,/g, "").replace(/x/g, "");
            return Number(validValue);
        } catch (error) {
            warn("input edit box error ----------------- ", editBox.string);
            return this.defaultBetLevel;
        }
    }

    @render(InstantWinConfigStore, (store) => store.defaultBetLevel)
    showDefaultBetLevel(defaultBetLevel: number) {
        if (defaultBetLevel > 0) {
            this.defaultBetLevel = defaultBetLevel;
            this.updateBetAmount(defaultBetLevel);
        }
    }

    @handle(BetAmountHandlers, (handle, amount: number) => handle.updateBetAmount(amount))
    updateBetAmount(amount: number) {
        return amount;
    }

    @render(BetAmountStore, (store) => store.amount)
    renderBetAmount(amount: any) {
        if (amount?.value) {
            this.setBetAmount(amount.value);
        }
    }

    setBetAmount(betAmount: number) {
        this.inputBetAmount.string = FormatUtils.numberWithCommas(betAmount, 2);
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

    onClickOverlayBg() {
        this.openBetAmountPopup(false);
    }

    @render(BetAmountStore, (store) => store.disabledBetAmount)
    disabledBetAmount(disabledBetAmount: boolean) {
        this.nodeDisabledBetAmount.active = disabledBetAmount;
        this.inputBetAmount.enabled = !disabledBetAmount;
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
}
