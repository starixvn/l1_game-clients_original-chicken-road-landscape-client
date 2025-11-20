import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetAmountHandlers } from "../bet-amount-handlers";
import { BetAmountStore } from "../bet-amount-store";

const { FormatUtils } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class BetLevelItem extends ObserverComponent {
    @property(Label)
    lblBet: Label = null;

    @property(Node)
    nodeDisabledLayer: Node = null;

    private key = "";

    @handle(BetAmountHandlers, (handler, key: string) => handler.clickBetLevel(key))
    onClickBetItem() {
        AudioUtils.playClick();
        return this.key;
    }

    @render(BetAmountStore, (store) => store.disabledBetAmount)
    setDisabledLayerVisibility(disabledBetAmount: boolean) {
        this.nodeDisabledLayer.active = disabledBetAmount;
    }

    setData(betLevel: number | string, isMax: boolean) {
        this.key = betLevel.toString();
        this.node.name = this.key;
        if (isMax) {
            this.lblBet.string = this.key.toUpperCase();
        } else {
            this.lblBet.string = FormatUtils.nFormatter(betLevel);
        }
    }
}
