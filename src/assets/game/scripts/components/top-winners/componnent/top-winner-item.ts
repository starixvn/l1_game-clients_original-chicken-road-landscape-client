import gc from "@sg/game-client-base";
import { _decorator, Color, Component, Label } from "cc";
import { truncatedNickname } from "db://shared-components/shared/utils/utils";
import { TopWinner } from "../top-winners-store";
const { ccclass, property } = _decorator;

const { FormatUtils } = gc;

@ccclass
export class TopWinnerItem extends Component {
    @property(Label)
    lblName: Label = null;

    @property(Label)
    lblBet: Label = null;

    @property(Label)
    lblMultiplier: Label = null;

    @property(Label)
    lblWin: Label = null;

    public winnerData: TopWinner = null;
    private isMainPlayer = false;

    private getColor(isMain: boolean) {
        return new Color(isMain ? "#36DCFF" : "#B3BEC1");
    }

    private formatName(name: string, isMain: boolean) {
        return isMain ? name : `${name[0]}***${name.slice(-3)}`;
    }

    setData(data: TopWinner, isMain: boolean) {
        this.winnerData = data;
        this.isMainPlayer = isMain;

        this.lblName.string = this.formatName(data.name, isMain);
        this.lblName.color = this.getColor(isMain);

        this.lblWin.string = FormatUtils.numberWithCommas(data.winningAmount, 2);
        this.lblBet.string = FormatUtils.numberWithCommas(data.amount, 2);
        this.lblMultiplier.string = FormatUtils.numberWithCommas(data.multiplier, 2);
    }

    setHighlight(isMain: boolean) {
        if (!this.winnerData || this.isMainPlayer === isMain) { return; }
        this.isMainPlayer = isMain;
        this.lblName.string = this.formatName(this.winnerData.name, isMain);
        this.lblName.color = this.getColor(isMain);
    }
}
