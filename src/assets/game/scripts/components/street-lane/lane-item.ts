import { _decorator, Color, Label, Node, sp, Sprite, Widget } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../audios/AudioIds";
import { settings } from "../../game-settings";
import { BetHandler } from "../bets/bet-handler";
import { BetStore, BetUIState } from "../bets/bet-store";
import { AutoPlayStore } from "../play-mode/auto-play/auto-play-store";
import { Vehicle } from "../vehicles/vehicle";

const { ccclass, property } = _decorator;
const { handle, render } = Observer;
@ccclass
export default class LaneItem extends ObserverComponent {
    @property(Label)
    lblMultiplier: Label = null;

    @property(Sprite)
    multiplierBg: Sprite = null;

    @property(sp.Skeleton)
    barrierSpine: sp.Skeleton = null;

    @property(Node)
    vehicleNode: Node = null;

    @property(Label)
    lblCurrentMultiplier: Label = null;

    @property(Node)
    currentStepMultiplierBg: Node = null;

    @property(Node)
    decorGrate: Node = null;

    @property(Node)
    decor1Node: Node = null;

    @property(Node)
    decor2Node: Node = null;

    @property(Node)
    streetLineNode: Node = null;

    private vehicle: Vehicle = null;
    private uiState: BetUIState = BetUIState.Start;
    private isAutoPlay = false;
    public isClickable = false;

    onLoad(): void {
        super.onLoad();
        this.init();
    }

    private init() {
        if (!this.barrierSpine) {
            console.error("Barrier spine is not assigned");

            return;
        }
        this.barrierSpine.node.active = false;
        this.currentStepMultiplierBg.active = false;
        this.decorGrate.active = false;
        this.decor1Node.active = false;
        this.decor2Node.active = false;
        this.vehicle = this.vehicleNode.getComponent(Vehicle);
    }

    async playStepSuccess(hasVehicle = false) {
        await AnimationUtils.delayTime(settings.durations.stepAnimation);
        this.barrierSpine.node.active = true;
        AnimationUtils.playSpine(this.barrierSpine, "barrier");
        if (hasVehicle) {
            this.vehicle.playVehicleStopAtBarrier();
        }
    }

    toggleCurrentMultiplierBackground(isCurrentStep = true) {
        this.currentStepMultiplierBg.active = isCurrentStep;
        this.lblMultiplier.node.active = !isCurrentStep;
        this.lblCurrentMultiplier.node.active = isCurrentStep;
    }

    setMultiplier(multiplier: number) {
        const multiplierString = `${multiplier.toFixed(2)}x`;
        this.lblMultiplier.string = multiplierString;
        this.lblCurrentMultiplier.string = multiplierString;
    }

    resetLaneItem() {
        this.barrierSpine.node.active = false;
        this.vehicle.resetVehicle();
        this.isClickable = false;
    }

    async waitAndStopSpawningVehicle() {
        if (this.vehicle.isPLayingAnimation) {
            const remainingTime = this.vehicle.getRemainingTime();
            await AnimationUtils.delayTime(remainingTime);
        }
        this.vehicle.stopSpawnVehicle();
    }

    startRandomSpawning() {
        if (!this.vehicle.isSpawning) {
            this.vehicle.startRandomSpawning();
        }
    }

    playCrashVehicle() {
        this.vehicle.playCrashVehicle();
    }

    changeMultiplierBgColor(color: Color) {
        this.multiplierBg.color = color;
    }

    private onClickBet() {
        if (this.isAutoPlay || !this.isClickable) {
            return;
        }

        if (this.uiState === BetUIState.Animating || this.uiState === BetUIState.Settle) {
            return;
        }
        if (this.uiState === BetUIState.Start) {
            this.onClickStartBet();
        } else if (this.uiState === BetUIState.Mining) {
            this.onClickBetButton();
        }
    }

    private onClickStartBet() {
        AudioUtils.playSFX(AudioIds.BTN_START);
        this.onBet();
    }

    private onClickBetButton() {
        if (this.uiState === BetUIState.Mining) {
            this.onBet();
        }
    }

    @handle(BetHandler, (handler) => handler.handle())
    private onBet() { }

    @render(BetStore, (store) => store.uiState, { fireImmediately: false })
    private updateUIState(uiState: BetUIState) {
        this.uiState = uiState;
    }

    @render(AutoPlayStore, (store) => store.isAutoplay)
    private setIsAutoPlay(isAutoPlay: boolean) {
        this.isAutoPlay = isAutoPlay;
    }

    public configGrate(isFirst: boolean, isLast: boolean) {
        if (!this.decorGrate) {
            return;
        }

        const shouldActive = isFirst || isLast;
        this.decorGrate.active = shouldActive;

        if (shouldActive) {
            const widget = this.decorGrate.getComponent(Widget);
            if (!widget) {
                console.warn("decorGrate needs a Widget component for positioning.");
                return;
            }

            if (isFirst) {
                widget.isAlignLeft = true;
                widget.left = 0;
                widget.isAlignRight = false;
            } else if (isLast) {
                widget.isAlignRight = true;
                widget.right = 0;
                widget.isAlignLeft = false;
            }
            widget.updateAlignment();
        }
    }

    public configDecors(showDecor1: boolean, showDecor2: boolean) {
        if (this.decor1Node) {
            this.decor1Node.active = showDecor1;
        }
        if (this.decor2Node) {
            this.decor2Node.active = showDecor2;
        }
    }
}
