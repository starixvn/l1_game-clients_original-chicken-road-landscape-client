import gc from "@sg/game-client-base";

import { _decorator, sp } from "cc";
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

    onLoad() {
        this.initMix();
        super.onLoad();
    }

    initMix() {
        if (!this.spineChicken) {
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

    async playStep() {
        await this.playAnim({ animName: "moving" });
    }

    async playStepSuccessAtLastLane() {
        await this.playStep();
        await this.playAnim({ animName: "final" });
        this.playIdle();
    }

    async playStepSuccess(hasVehicle = false) {
        await this.playStep();

        if (hasVehicle) {
            this.playAnim({ animName: "win" });
            AnimationUtils.delayTime(settings.durations.winAnimation).then(() => {
                const isNotPlayMovingAnim = !AnimationUtils.isAnimationPlaying(this.spineChicken, "moving");
                if (isNotPlayMovingAnim) {
                    this.playIdle();
                }
            });
        } else {
            this.playIdle();
        }
    }

    async playStepFail() {
        await this.playStep();
        await this.playAnim({ animName: "crash" });
    }

    /** Gọi khi crash → anim + move vào giữa scene + reset */
    async playCrashAtCenter() {
        this.playSound(AudioIds.CAR_HIT);
        this.playStepFail();
        await AnimationUtils.delayTime(settings.durations.crashAnimation);
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }
}
