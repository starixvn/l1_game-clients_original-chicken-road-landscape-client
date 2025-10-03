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
    lblBalance: Label = null;

    private encryptedName(name: string): string {
        return `${name.substring(0, 1)}***${name.substring(name.length - 3, name.length)}`;
    }

    setData(data: TopWinner, isMainPlayer: boolean) {
        this.lblName.string = isMainPlayer ? truncatedNickname(data.name, 7) : this.encryptedName(data.name);
        this.lblName.color = isMainPlayer ? new Color("#FCE966") : new Color("#B3BEC1");
        this.lblBalance.string = "+" + FormatUtils.numberWithCommas(data.winningAmount, 2);
    }
}
