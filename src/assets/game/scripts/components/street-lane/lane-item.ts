import { _decorator, Component, Label, Node, sp, Sprite, SpriteFrame } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { settings } from "../../game-settings";
import { Vehicle } from "../vehicles/vehicle";

const { ccclass, property } = _decorator;

@ccclass
export default class LaneItem extends Component {
    @property(Label)
    lblMultiplier: Label = null;

    @property(Sprite)
    multiplierBg: Sprite = null;

    @property(SpriteFrame)
    defaultMultiplierBgFrame: SpriteFrame = null;

    @property(SpriteFrame)
    currentStepMultiplierBgFrame: SpriteFrame = null;

    @property(SpriteFrame)
    nextStepMultiplierBgFrame: SpriteFrame = null;

    @property(sp.Skeleton)
    barrierSpine: sp.Skeleton = null;

    @property(Node)
    vehicleNode: Node = null;

    @property(Label)
    lblCurrentMultiplier: Label = null;

    @property(Node)
    currentStepMultiplierBg: Node = null;

    private vehicle: Vehicle = null;

    onLoad(): void {
        this.currentStepMultiplierBg.active = false;
        this.vehicle = this.vehicleNode.getComponent(Vehicle);
        this.initBarrier();
    }

    private initBarrier() {
        if (!this.barrierSpine) {
            console.error("Barrier spine is not assigned");

            return;
        }
        this.barrierSpine.node.active = false;
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
}
