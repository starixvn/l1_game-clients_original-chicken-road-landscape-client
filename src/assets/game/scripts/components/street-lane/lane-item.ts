import { _decorator, Component, Label, Node, sp, Sprite, SpriteFrame, tween, v3 } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { settings } from "../../game-settings";

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

    @property(Node)
    barrierNode: Node = null;

    @property(sp.Skeleton)
    barrierSpine: sp.Skeleton = null;

    @property(Node)
    vehicleNode: Node = null;

    @property(Label)
    lblCurrentMultiplier: Label = null;

    @property(Node)
    currentStepMultiplierBg: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    @property(Node)
    vehicleEndPoint: Node = null;

    @property(SpriteFrame)
    vehicles: SpriteFrame[] = [];

    currentVehicleSpriteFrame: SpriteFrame = null;

    onLoad(): void {
        this.currentStepMultiplierBg.active = false;
        this.barrierNode.active = false;
        this.vehicleNode.active = false;
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
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
            this.playVehicle();
        }
    }

    private playVehicle() {
        const randomVehicle = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
        this.vehicleNode.getComponent(Sprite).spriteFrame = randomVehicle;
        this.vehicleNode.active = true;
        const vehicleEndPointPos = this.vehicleEndPoint.position;
        tween(this.vehicleNode)
            .to(0.5, { position: v3(vehicleEndPointPos.x, vehicleEndPointPos.y, 0) })
            .start();
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
        this.vehicleNode.active = false;
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
    }
}
