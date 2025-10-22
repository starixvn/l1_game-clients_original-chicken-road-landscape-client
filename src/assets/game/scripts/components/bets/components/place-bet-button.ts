import gc from "@sg/game-client-base";
import {
    _decorator,
    Animation,
    Button,
    EventKeyboard,
    EventTouch,
    input,
    Input,
    Intersection2D,
    KeyCode,
    Label,
    math,
    Node,
    PolygonCollider2D,
    sp,
    v3,
} from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../../audios/AudioIds";
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

    private isFinishedPlayAnim = true;

    private uiState: BetUIState = BetUIState.Start;

    @render(BetStore, (store) => store.uiState, { fireImmediately: false })
    setUIState(uiState: BetUIState) {
        this.uiState = uiState;
    }

    onLoad() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        super.onLoad();
    }

    onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.SPACE) {
            this.onClickSpace();
        }
    }

    private onClickSpace() {
        if (!this.isFinishedPlayAnim) {
            return;
        }
        if (this.uiState === BetUIState.Start) {
            this.onClickStartBet();
        } else if (this.canBet) {
            this.onClickBetButton();
        }
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
        this.isFinishedPlayAnim = false;
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
            await AnimationUtils.delayTime(2);
            this.isFinishedPlayAnim = true;
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
            this.isFinishedPlayAnim = false;
        }
    }

    get canBet() {
        return this.isStateBet && this.isFinishedPlayAnim;
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

    @render(BetStore, (store) => store.uiState)
    updateButtonInteractable(uiState: BetUIState) {
        const buttonCashOut = this.cashOutButton.getComponent(Button);
        buttonCashOut.interactable = uiState !== BetUIState.Settle && uiState !== BetUIState.Start && uiState !== BetUIState.Started;

        const hitStoneButton = this.hitStoneButton.getComponent(Button);
        hitStoneButton.interactable = uiState !== BetUIState.Settle;


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
