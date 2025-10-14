import { _decorator, Color, Component, Label, Sprite } from "cc";
const { ccclass, property } = _decorator;

@ccclass("BetWinCell")
export class BetWinCell extends Component {
    @property(Label)
    lblWin: Label = null;

    @property({ type: Sprite })
    btnReachMaxWin: Sprite = null;

    setData(amount: string, isReachMaxWin: boolean) {
        this.lblWin.string = amount;
        this.lblWin.color = new Color().fromHEX("F1E344");

        this.btnReachMaxWin.node.active = isReachMaxWin;

        if (!isReachMaxWin) {
            this.lblWin.node.setPosition(0, 0);
        }
    }
}
