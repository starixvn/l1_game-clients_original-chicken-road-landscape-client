import gc from "@sg/game-client-base";
import {
    _decorator,
    Animation,
    Button,
    EventTouch,
    Font,
    Intersection2D,
    Label,
    math,
    Node,
    PolygonCollider2D,
    sp,
    v3
} from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../../audios/AudioIds";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../../game-configs";
import { changeCursorPointer } from "../../../utils";
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

    @property(sp.Skeleton)
    chickenEffect: sp.Skeleton = null;

    @property(Node)
    debugNode: Node = null;

    @property(ChickenController)
    chickenCtrl: ChickenController = null;

    @property(Node)
    playModeNode: Node = null;

    private isStateBet = false;
    private multiplier = 0;
    private readonly fontMultipliers: Font[] = [];
    private isPlayAnimation = false;

    private readonly EFFECT_RESET_DELAY = 1;

    private cashOutButtonInteractable = false;
    private currentConfig: FixedStepsMultiplierConfig;

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        this.currentConfig = currentMultiplierConfig;
    }

    onLoad() {

        super.onLoad();
    }


    onDestroy(): void {
        this.removeEvent();
        super.onDestroy();
    }

    @handle(BetHandler, (handler) => handler.handle())
    onBet() {}

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

    onClickBetButton() {
        if (this.canBet) {
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

    protected touchInPolygon(event: EventTouch, node: Node) {
        const location = event.getUILocation();
        const polygon = node.getComponent(PolygonCollider2D).worldPoints;
        return Intersection2D.pointInPolygon(math.v2(location.x, location.y), polygon);
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

}
