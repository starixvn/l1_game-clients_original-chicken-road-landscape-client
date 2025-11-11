import gc from "@sg/game-client-base";
import { _decorator, Label, Node, Size, UITransform } from "cc";
import Observer from "observer";
import MainPlayerProfile from "../../../../../extensions/shared-components/assets/game/main-player-profile/scripts/components/main-player-profile";
const { ccclass, property } = _decorator;
const { render } = Observer;
const { Player } = gc;
const { MainPlayerStore } = Player;

@ccclass
export class BalanceInfo extends MainPlayerProfile {
    @property(Node)
    balanceFrame: Node = null;

    private readonly minWidth = 180;
    private readonly maxWidth = 200;

    @render(MainPlayerStore, (store) => store.balance)
    setUIBalance(balance: number) {
        if (balance.toString().length > 9) {
            this.lblBalance.overflow = Label.Overflow.SHRINK;
            const a = this.balanceFrame.getComponent(UITransform);
            a.setContentSize(new Size(this.maxWidth, 50));
        } else {
            this.lblBalance.overflow = Label.Overflow.NONE;
            const a = this.balanceFrame.getComponent(UITransform);
            const width = Math.min(Math.max(balance.toString().length * 30, this.minWidth), this.maxWidth);
            a.setContentSize(new Size(width, 50));
        }
    }
}
