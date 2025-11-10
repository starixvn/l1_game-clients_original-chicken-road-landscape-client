import { _decorator, Component, sp } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { AudioIds } from "../../../audios/AudioIds";
import { settings } from "../../game-settings";
const { ccclass, property } = _decorator;

@ccclass("Chicken")
export class Chicken extends Component {
    @property(sp.Skeleton)
    spineChicken: sp.Skeleton = null;

    onLoad() {
        this.initMix();
    }

    initMix() {
        if (!this.spineChicken) {
            console.error("SpineChicken is not assigned");
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
            this.playAnim({ animName: "win" }).then(() => {
                this.checkPlayIdle();
            });
        } else {
            this.playIdle();
        }
    }

    private checkPlayIdle() {
        const isNotPlayMovingAnim = !AnimationUtils.isAnimationPlaying(this.spineChicken, "moving");
        if (isNotPlayMovingAnim) {
            this.playIdle();
        }
    }

    async playStepFail() {
        await this.playStep();
        this.playAnim({ animName: "crash" });
    }

    async playCrash() {
        AudioUtils.playSFX(AudioIds.CAR_HIT);
        this.playStepFail();
        await AnimationUtils.delayTime(settings.durations.crashAnimation);
    }
}
