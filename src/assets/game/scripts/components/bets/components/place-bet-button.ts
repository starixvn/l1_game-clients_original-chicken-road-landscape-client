import gc from "@sg/game-client-base";
import {
    _decorator,
    Animation,
    BitmapFont,
    Button,
    EventTouch,
    Font,
    Intersection2D,
    Label,
    log,
    math,
    Node,
    PolygonCollider2D,
    sp,
    v3,
} from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../../audios/AudioIds";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../../game-configs";
import { changeCursorPointer, MULTIPLIER_FONT_NAME } from "../../../utils";
import { ChickenController } from "../../chicken/chicken";
import { BetHandler } from "../bet-handler";
import { BetStore, BetUIState } from "../bet-store";

const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export default class PlaceBetButton extends ObserverComponent {
    @property(Node)
    cashOutButton: Node = null;

    @property(Node)
    startBetButton: Node = null;

    @property(Node)
    hitStoneButton: Node = null;

    @property(Label)
    lblMultiplier: Label = null;

    @property(Label)
    lblMoney: Label = null;

    @property(Node)
    tapArea: Node = null;

    @property(sp.Skeleton)
    effect: sp.Skeleton = null;

    @property(sp.Skeleton)
    chickenEffect: sp.Skeleton = null;

    @property(Node)
    debugNode: Node = null;

    @property(ChickenController)
    chickenCtrl: ChickenController = null;

    @property(Node)
    playModeNode: Node = null;

    private isStateBet = false;
    private upgradeTimeStamp = 0;
    private multiplier = 0;
    private currentAnimationName = "";
    private readonly fontMultipliers: Font[] = [];
    private activeMoneyFont: Font = null;
    private disableMoneyFont: Font = null;
    private isPlayAnimation = false;

    private readonly EFFECT_RESET_DELAY = 1;

    private nodeGuideHit: Node = null;
    private cashOutButtonInteractable = false;
    private currentConfig: FixedStepsMultiplierConfig;

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        this.currentConfig = currentMultiplierConfig;
    }

    onLoad() {
        //this.loadFonts();

        this.nodeGuideHit = this.hitStoneButton.getChildByName("hand");
        this.initializeAnimations();
        super.onLoad();
    }

    async loadFonts() {
        bundleManager.loadAssetsFromBundle("resources", `fonts/yellow-number`, Font, null).then((font) => {
            try {
                this.activeMoneyFont = font;
                this.updateFontButtonCashOut();
            } catch (e) {}
        });
        bundleManager.loadAssetsFromBundle("resources", `fonts/gray-number`, Font, null).then((font) => {
            try {
                this.disableMoneyFont = font;
                this.updateFontButtonCashOut();
            } catch (e) {}
        });
        for (const fontName of MULTIPLIER_FONT_NAME) {
            const font = await bundleManager.loadAssetsFromBundle("resources", `fonts/${fontName}-number`, BitmapFont, null);
            this.fontMultipliers.push(font);
        }
    }

    onDestroy(): void {
        this.removeEvent();
        super.onDestroy();
    }

    private initializeAnimations(): void {
        this.resetEffect();
    }

    resetEffect() {
        this.effect && this.effect.setAnimation(0, "levitation", true);
    }

    @handle(BetHandler, (handler) => handler.handle())
    onBet() {
        this.unschedule(this.resetEffect);
        this.scheduleOnce(this.resetEffect, this.EFFECT_RESET_DELAY);
    }

    @handle(BetHandler, (handler) => handler.handle())
    onClickStartBet() {
        this.playSound(AudioIds.BTN_START);
    }

    @render(BetStore, (store) => store.settleStatus, { fireImmediately: false })
    handleCrash(settleStatus: any) {
        if (settleStatus) {
            !settleStatus.win && this.playCrashAnimation();
        }
    }

    @handle(BetHandler, (handler) => handler.handleCashOut())
    onClickCashOut() {
        this.playSound(AudioIds.BTN_CASHOUT);
    }

    @render(BetStore, (store) => store.multiplier)
    async updateMultiplier(multiplier: number) {
        try {
            this.multiplier = multiplier;

            this.lblMultiplier.string = `${gc.FormatUtils.numberWithCommas(multiplier, 2, false)}x`;
            //this.updateMultiplierColor(level);
            await AnimationUtils.delayTime(2);
            this.isPlayAnimation = false;
            if (this.lblMultiplier) {
                this.lblMultiplier.string = `${gc.FormatUtils.numberWithCommas(multiplier, 2, false)}x`;
            }
        } catch (e) {}
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @render(BetStore, (store) => store.winAmount)
    updateCashOutValue(cashOutValue: number) {
        this.lblMoney.string = gc.FormatUtils.numberWithCommas(cashOutValue, 2, true);
    }

    updateMultiplierColor(level: number) {
        const index = level - 1;
        if (index < this.fontMultipliers.length) {
            this.lblMultiplier.font = this.fontMultipliers[index];
        } else {
            log("not exist font multiplier with index ", index);
        }
    }

    onClickBetButton() {
        if (this.canBet) {
            console.log(`onClickBetButton : canBet:${this.isStateBet} ${!this.isPlayAnimation} ${this.isStateBet && !this.isPlayAnimation}`);
            this.onBet();
            this.isPlayAnimation = true;
        }
    }

    get canBet() {
        return this.isStateBet && !this.isPlayAnimation;
    }

    validTapArea() {
        if (this.canBet) {
            changeCursorPointer();
        }
    }

    onTap(event: EventTouch) {
        if (this.touchInPolygon(event, this.tapArea) && this.canBet) {
            this.nodeGuideHit.active = false;
            this.onBet();
        }
    }

    protected touchInPolygon(event: EventTouch, node: Node) {
        const location = event.getUILocation();
        const polygon = node.getComponent(PolygonCollider2D).worldPoints;
        return Intersection2D.pointInPolygon(math.v2(location.x, location.y), polygon);
    }

    async playTapAnimation() {
        this.effect.setAnimation(0, `tap_3`, false);
    }

    async playCrashAnimation() {
        try {
            this.playSound(AudioIds.CRASHED);
            this.completeSettle();
        } catch (e) {}
    }

    @handle(BetHandler, (handler) => handler.completeSettle())
    completeSettle() {}

    removeEvent() {}

    @render(BetStore, (store) => store.uiState)
    updateUIState(uiState: BetUIState) {
        this.startBetButton.active = uiState === BetUIState.Start;
        this.playModeNode.active = uiState === BetUIState.Start;

        this.hitStoneButton.active = uiState >= BetUIState.Started;
        this.cashOutButton.active = uiState >= BetUIState.Started;

        this.isStateBet = uiState > BetUIState.Start && uiState !== BetUIState.Settle;

        if (uiState === BetUIState.Started) {
            // this.showAxe();
        }
    }

    @render(BetStore, (store) => store.multiplierVisible)
    updateMultiplierVisible(multiplierVisible: boolean) {
        this.lblMultiplier.node.active = multiplierVisible;
    }

    @render(BetStore, (store) => store.uiState)
    updateButtonInteractable(uiState: BetUIState) {
        const buttonCashOut = this.cashOutButton.getComponent(Button);
        buttonCashOut.interactable = uiState !== BetUIState.Settle && uiState !== BetUIState.Start && uiState !== BetUIState.Started;

        const hitStoneButton = this.hitStoneButton.getComponent(Button);
        hitStoneButton.interactable = uiState !== BetUIState.Settle;

        this.cashOutButtonInteractable = buttonCashOut.interactable;

        //this.updateFontButtonCashOut();
        const animation = this.lblMoney.getComponent(Animation);
        if (animation) {
            if (buttonCashOut.interactable) {
                animation.play();
            } else {
                animation.stop();
                this.lblMoney.node.scale = v3(1, 1, 1);
            }
        }
    }

    private updateFontButtonCashOut() {
        const font = this.cashOutButtonInteractable ? this.activeMoneyFont : this.disableMoneyFont;
        if (font) {
            this.lblMoney.font = font;
        }
    }
}
