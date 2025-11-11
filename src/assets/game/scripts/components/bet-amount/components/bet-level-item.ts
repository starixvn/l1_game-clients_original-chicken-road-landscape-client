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

    private key = "";

    @handle(BetAmountHandlers, (handler, key: string) => handler.clickBetLevel(key))
    onClickBetItem() {
        return this.key;
    }

    setData(betLevel: number | string, isMax: boolean) {
        this.key = betLevel.toString();
        if (isMax) {
            this.lblBet.string = this.key.toUpperCase();
        } else {
            this.lblBet.string = FormatUtils.nFormatter(betLevel);
        }
    }
}
