import gc from "@sg/game-client-base";
import { _decorator, Component, Label } from "cc";
const { ccclass, property } = _decorator;

@ccclass("BetValueItem")
export class BetValueItem extends Component {
    label: Label = null;

    fetchLabel() {
        this.label = this.getComponentInChildren(Label);
    }

    setValue(value: number) {
        if (!this.label) {
            this.fetchLabel();
        }
        this.label.string = gc.FormatUtils.numberWithCommas(value);
    }
}
