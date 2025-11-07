import gc from "@sg/game-client-base";

import { _decorator, Node, sp, Sprite, SpriteFrame, tween, v3, Vec3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../audios/AudioIds";
import { settings } from "../../game-settings";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("ChickenController")
export class ChickenController extends ObserverComponent {
    @property(sp.Skeleton)
    spineChicken: sp.Skeleton = null;

    @property(sp.Skeleton)
    barrierSpine: sp.Skeleton = null;

    private startPos: Vec3 = v3(0, 0, 0);

    @property(Node)
    vehicleNode: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    @property(Node)
    vehicleEndPoint: Node = null;

    @property(SpriteFrame)
    vehicles: SpriteFrame[] = [];

    currentVehicleSpriteFrame: SpriteFrame = null;

    onLoad() {
        this.initMix();
        super.onLoad();
    }

    initMix() {
        if (!this.spineChicken || !this.barrierSpine) {
            console.error("SpineChicken or barrier is not assigned");
            return;
        }

        this.spineChicken.setMix("idle", "moving", 0.2);
        this.spineChicken.setMix("moving", "win", 0.2);
        this.spineChicken.setMix("moving", "crash", 0.2);
        this.spineChicken.setMix("win", "idle", 0.2);
        this.spineChicken.setMix("crash", "idle", 0.2);
        this.spineChicken.setMix("moving", "idle", 0.2);
        this.spineChicken.setMix("moving", "final", 0.2);
    }

    async playAnim({ animName, loop, duration }: { animName: string; loop?: boolean; duration?: number }) {
        if (!this.spineChicken) {
            return;
        }
        await AnimationUtils.playSpine(this.spineChicken, animName, loop, duration);
    }

    playIdle() {
        this.playAnim({ animName: "idle", loop: true });
    }

    playStep() {
        this.playAnim({ animName: "moving" });
    }

    playCrash() {
        this.playAnim({ animName: "crash" });
    }

    async playFinalStep() {
        await this.playAnim({ animName: "moving" });
        await this.playAnim({ animName: "final" });
    }

    async playStepSuccessAtLastLane() {
        if (this.barrierSpine.node.active) {
            this.barrierSpine.node.active = false;
        }
        await this.playAnim({ animName: "moving" });
        this.barrierSpine.node.active = true;
        AnimationUtils.playSpine(this.barrierSpine, "barrier");
        await this.playAnim({ animName: "final" });
        this.playIdle();
    }

    async playStepSuccess(hasVehicle = false) {
        await this.playAnim({ animName: "moving" });
        this.barrierSpine.node.active = true;
        AnimationUtils.playSpine(this.barrierSpine, "barrier");
        if (hasVehicle) {
            this.playVehicle();
            await this.playAnim({ animName: "win" });
        }
        this.barrierSpine.node.active = false;
        this.playIdle();
        if (hasVehicle) {
            this.resetVehicle();
        }
    }

    async playStepFail() {
        if (this.barrierSpine.node.active) {
            this.barrierSpine.node.active = false;
        }
        await this.playAnim({ animName: "moving" });
        await this.playAnim({ animName: "crash" });
    }

    setStartPos(pos: Vec3) {
        this.startPos = pos.clone();
    }

    resetPos() {
        this.node.setPosition(this.startPos);
    }

    /** Gọi khi crash → anim + move vào giữa scene + reset */
    async playCrashAtCenter() {
        this.playSound(AudioIds.CAR_HIT);
        this.playStepFail();
        await AnimationUtils.delayTime(settings.durations.crashAnimation);
    }

    hideBarrier() {
        if (this.barrierSpine.node.active) {
            this.barrierSpine.node.active = false;
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    randomVehicle() {
        this.currentVehicleSpriteFrame = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
        return this.currentVehicleSpriteFrame;
    }

    playVehicle() {
        this.vehicleNode.getComponent(Sprite).spriteFrame = this.currentVehicleSpriteFrame;
        this.vehicleNode.active = true;
        const vehicleEndPointPos = this.vehicleEndPoint.position;
        tween(this.vehicleNode)
            .to(0.5, { position: v3(vehicleEndPointPos.x, vehicleEndPointPos.y, 0) })
            .start();
    }

    resetVehicle() {
        this.vehicleNode.setPosition(this.vehicleStartPoint.position);
        this.vehicleNode.active = false;
    }
}
