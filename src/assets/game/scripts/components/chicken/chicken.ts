import gc from "@sg/game-client-base";

import { _decorator, Node, sp, v3, Vec3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../audios/AudioIds";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("ChickenController")
export class ChickenController extends ObserverComponent {
    @property(sp.Skeleton)
    spineChicken: sp.Skeleton = null;

    @property(sp.Skeleton)
    barrelSpine: sp.Skeleton = null;

    private startPos: Vec3 = v3(0, 0, 0);
    isPlayAnimation = false;

    @property(Node)
    vehicleNode: Node = null;

    @property(Node)
    vehicleStartPoint: Node = null;

    onLoad() {
        this.initMix();
        super.onLoad();
    }

    initMix() {
        if (!this.spineChicken || !this.barrelSpine) {
            console.error("SpineChicken or barrel is not assigned");
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
        this.isPlayAnimation = true;

        if (this.barrelSpine.node.active) {
            this.barrelSpine.node.active = false;
        }
        console.log("playStepSuccessAtLastLane");
        await this.playAnim({ animName: "moving" });
        this.barrelSpine.node.active = true;
        AnimationUtils.playSpine(this.barrelSpine, "barrel");
        await this.playAnim({ animName: "final" });
        await AnimationUtils.delayTime(1);
        this.playIdle();
        this.isPlayAnimation = false;
    }

    async playStepSuccess() {
        if (this.barrelSpine.node.active) {
            this.barrelSpine.node.active = false;
        }
        console.log("playStepSuccess");
        await this.playAnim({ animName: "moving" });
        this.barrelSpine.node.active = true;
        AnimationUtils.playSpine(this.barrelSpine, "barrel");
        await this.playAnim({ animName: "win" });
        this.playIdle();
    }

    async playStepFail() {
        if (this.barrelSpine.node.active) {
            this.barrelSpine.node.active = false;
        }
        console.log("playStepFail");
        // this.playVehicle();
        await this.playAnim({ animName: "moving" });
        await this.playAnim({ animName: "crash" });
    }

    // private playVehicle() {
    //     const vehicleStartPos = this.vehicleStartPoint.position;
    //     this.vehicleNode.active = true;
    //     tween(this.vehicleNode)
    //         .to(1, { position: v3(0, vehicleStartPos.y - 500, 0) })
    //         .start();
    // }

    // private resetVehicle() {
    //     this.vehicleNode.setPosition(this.vehicleStartPoint.position);
    //     this.vehicleNode.active = false;
    // }

    setStartPos(pos: Vec3) {
        this.startPos = pos.clone();
    }

    resetPos() {
        this.node.setPosition(this.startPos);
    }

    /** Gọi khi crash → anim + move vào giữa scene + reset */
    async playCrashAtCenter() {
        if (this.isPlayAnimation) {
            return;
        }
        this.isPlayAnimation = true;

        this.playSound(AudioIds.CAR_HIT);
        this.playStepFail();
        await AnimationUtils.delayTime(5);
        // this.resetVehicle();
        this.isPlayAnimation = false;
    }

    hideBarrier() {
        if (this.barrelSpine.node.active) {
            this.barrelSpine.node.active = false;
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }
}
