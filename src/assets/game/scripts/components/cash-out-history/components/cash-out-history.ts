import gc from "@sg/game-client-base";

import { _decorator, BitmapFont, Font, instantiate, Label, Node, Prefab, Sprite, SpriteFrame } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { changePointerWhenHover, getCurrentAnimationLevel, MULTIPLIER_FONT_NAME } from "../../../utils";
import { HashHandlers } from "../../hash/hash-handlers";
import { CashOutHistoryStore } from "../cash-out-history-store";
const { FormatUtils } = gc;

const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export default class CashOutHistory extends ObserverComponent {
    @property(Prefab)
    lblCashOutHistory: Prefab = null;

    @property(Node)
    cashOutHistoryPanel: Node = null;

    @property([SpriteFrame])
    bgMultipliers: SpriteFrame[] = [];

    private rounds: gc.RoundHistories.RoundHistory[];
    private readonly fontMultipliers: Font[] = [];

    async onLoad() {
        await this.loadFonts();
        super.onLoad();
    }

    async loadFonts() {
        for (const fontName of MULTIPLIER_FONT_NAME) {
            const font = await bundleManager.loadAssetsFromBundle("resources", `fonts/${fontName}-number`, BitmapFont, null);
            this.fontMultipliers.push(font);
        }
    }

    @render(gc.GameCrash.RoundHistory.CrashRoundHistoryStore, (store) => store, { fireImmediately: false })
    setRoundsInfo(rounds: gc.GameCrash.RoundHistory.CrashRoundHistoryStore) {
        this.rounds = rounds.roundHistories;
    }

    @render(CashOutHistoryStore, (store) => store.cashOutHistory)
    updateCashOutHistory(cashOutHistory: any[]) {
        this.cashOutHistoryPanel.removeAllChildren();
        [...cashOutHistory].reverse().forEach((item, index) => {
            const lblCashOutHistory = instantiate(this.lblCashOutHistory);
            const background = lblCashOutHistory.getComponentInChildren(Sprite);
            const label = lblCashOutHistory.getComponentInChildren(Label);
            label.string = `${FormatUtils.numberWithCommas(item.multiplier, 2, false)}x`;
            const multiplierIndex = getCurrentAnimationLevel(item.multiplier) - 1;
            label.font = this.fontMultipliers[multiplierIndex];
            background.spriteFrame = this.bgMultipliers[multiplierIndex];
            lblCashOutHistory.setPosition(0, index * -80);
            lblCashOutHistory.on(Node.EventType.TOUCH_END, () => {
                this.onClickRoundItem(item.roundId);
            });

            changePointerWhenHover(lblCashOutHistory);

            this.cashOutHistoryPanel.addChild(lblCashOutHistory);
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @handle(HashHandlers, (handle, roundId: number) => handle.openVerificationHistory(roundId))
    onClickRoundItem(roundId: number) {
        this.playSoundClick();
        return roundId;
    }
}
