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
    barrierSpine: sp.Skeleton = null;

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
        this.isPlayAnimation = true;

        if (this.barrierSpine.node.active) {
            this.barrierSpine.node.active = false;
        }
        console.log("playStepSuccessAtLastLane");
        await this.playAnim({ animName: "moving" });
        this.barrierSpine.node.active = true;
        AnimationUtils.playSpine(this.barrierSpine, "barrier");
        await this.playAnim({ animName: "final" });
        await AnimationUtils.delayTime(1);
        this.playIdle();
        this.isPlayAnimation = false;
    }

    async playStepSuccess() {
        console.log("playStepSuccess");
        await this.playAnim({ animName: "moving" });
        this.barrierSpine.node.active = true;
        AnimationUtils.playSpine(this.barrierSpine, "barrier");
        await this.playAnim({ animName: "win" });
        this.barrierSpine.node.active = false;
        this.playIdle();
    }

    async playStepFail() {
        if (this.barrierSpine.node.active) {
            this.barrierSpine.node.active = false;
        }
        console.log("playStepFail");
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
        if (this.isPlayAnimation) {
            return;
        }
        this.isPlayAnimation = true;

        this.playSound(AudioIds.CAR_HIT);
        this.playStepFail();
        await AnimationUtils.delayTime(5);
        this.isPlayAnimation = false;
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
}
