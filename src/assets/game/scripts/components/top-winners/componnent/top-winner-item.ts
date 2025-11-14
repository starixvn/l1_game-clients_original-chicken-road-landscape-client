import gc from "@sg/game-client-base";
import { _decorator, Color, Component, Label } from "cc";
import { CrashUtils } from "../../../crash-utils";
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
        const hasWon = !isNaN(data.winningAmount);

        this.lblWin.string = hasWon ? FormatUtils.numberWithCommas(data.winningAmount, 2) : "-";
        this.lblBet.string = FormatUtils.numberWithCommas(data.amount, 2);
        data.winningAmount === 0 && (this.lblWin.color = new Color("B3BEC1"));
        this.lblMultiplier.string = hasWon && data.winningAmount > 0 ? `${FormatUtils.numberWithCommas(data.multiplier, 2)}x` : "-";
        this.lblMultiplier.color =
            hasWon && data.winningAmount > 0 ? CrashUtils.getMultiplierColor(data.multiplier) : CrashUtils.getWhiteColor();
    }

    setHighlight(isMain: boolean) {
        if (!this.winnerData || this.isMainPlayer === isMain) {
            return;
        }
        this.isMainPlayer = isMain;
        this.lblName.string = this.formatName(this.winnerData.name, isMain);
        this.lblName.color = this.getColor(isMain);
    }
}
