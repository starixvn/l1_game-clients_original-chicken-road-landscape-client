import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetAmountHandlers } from "../bet-amount-handlers";

const { FormatUtils } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class BetLevelItem extends ObserverComponent {
    @property(Label)
    lblBet: Label = null;

    @property(Node)
    nodeSelectedBg: Node = null;

    @property(Node)
    nodeDisabledLayer: Node = null;

    private currentBetLevel = 0;

    @handle(BetAmountHandlers, (handler, amount: number) => handler.updateBetAmount(amount))
    onClickBetItem() {
        return +this.currentBetLevel;
    }

    setData(betLevel: number, isLastItem = false) {
        this.currentBetLevel = betLevel;
        if (isLastItem) {
            this.lblBet.string = "MAX";
        } else {
            this.lblBet.string = FormatUtils.nFormatter(betLevel);
        }
    }

    setSelectedNode(isSelected: boolean) {
        this.nodeSelectedBg.active = isSelected;
    }

    setDisabledNode(isDisabled: boolean) {
        this.nodeDisabledLayer.active = isDisabled;
    }
}
