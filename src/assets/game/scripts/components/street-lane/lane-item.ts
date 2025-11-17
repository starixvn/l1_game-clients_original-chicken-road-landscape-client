import { _decorator, Color, Label, Node, sp, Sprite, Widget } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils, FunctionUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { BetHandler } from "../bets/bet-handler";
import { BetStore, BetUIState } from "../bets/bet-store";
import { AutoPlayStore } from "../play-mode/auto-play/auto-play-store";
import { Vehicle } from "../vehicles/vehicle";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AudioIds } from "../../../audios/AudioIds";

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
    lblWinMultiplier: Label = null;

    @property(Node)
    winMultiplierNode: Node = null;

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

    private isAnimatingShow = false;

    onLoad(): void {
        this.init();
        super.onLoad();
    }

    private init() {
        if (!this.barrierSpine) {
            console.error("Barrier spine is not assigned");

            return;
        }
        this.barrierSpine.node.active = false;
        this.winMultiplierNode.active = false;
        this.decorGrate.active = false;
        this.decor1Node.active = false;
        this.decor2Node.active = false;
        if (this.vehicleNode) {
            this.vehicle = this.vehicleNode.getComponent(Vehicle);
        } else {
            console.error("Vehicle Node is not assigned");
        }
    }

    async playStepSuccess(hasVehicle = false) {
        this.barrierSpine.node.active = true;
        AnimationUtils.playSpine(this.barrierSpine, "barrier");
        if (hasVehicle) {
            this.vehicle.playVehicleStopAtBarrier();
            AudioUtils.playSFX(AudioIds.CAR_STOP);
            AudioUtils.playSFX(AudioIds.CHICKEN_SCREAM);
        }
    }

    toggleCurrentMultiplierBackground(isCurrentStep = true) {
        this.showWinMultiplier(isCurrentStep);
        this.lblMultiplier.node.active = !isCurrentStep;
    }

    async showWinMultiplier(isShow: boolean) {
        const spine = this.winMultiplierNode.getComponent(sp.Skeleton);
        if (isShow) {
            this.lblWinMultiplier.node.active = true;
            this.winMultiplierNode.active = true;
            this.isAnimatingShow = true;
            AnimationUtils.playSpine(spine, "show").then(() => {
                this.isAnimatingShow = false;
                AnimationUtils.playSpine(spine, "loop", true);
            });
        } else {
            try {
                await FunctionUtils.waitUntil(() => !this.isAnimatingShow, 100, 3000);
                AnimationUtils.playSpine(spine, "hide").then(() => {
                    this.winMultiplierNode.active = false;
                    this.lblWinMultiplier.node.active = false;
                });
            } catch (e) { }
        }
    }

    setMultiplier(multiplier: number) {
        const multiplierString = `${multiplier.toFixed(2)}x`;
        this.lblMultiplier.string = multiplierString;
        this.lblWinMultiplier.string = multiplierString;
    }

    resetLaneItem() {
        this.barrierSpine.node.active = false;
        this.vehicle.reset();
        this.isClickable = false;
    }

    stopSpawningVehicle() {
        this.vehicle.stopSpawningVehicle();
    }

    startRandomSpawning() {
        this.vehicle.startRandomSpawning();
    }

    playCrashVehicle(onCollision: () => void) {
        this.vehicle.playCrashVehicle(onCollision);
    }

    changeMultiplierBgColor(color: Color) {
        this.multiplierBg.color = color;
    }

    private onClickBet() {
        if (this.isAutoPlay || !this.isClickable) {
            return;
        }

        if (this.uiState === BetUIState.Mining) {
            this.onClickBetButton();
        }
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
