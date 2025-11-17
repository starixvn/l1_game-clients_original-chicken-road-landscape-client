import { _decorator, Component, sp } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { AudioIds } from "../../../audios/AudioIds";
const { ccclass, property } = _decorator;

enum ChickenState {
    Idle = "idle",
    Moving = "moving",
    Win = "win",
    Crash = "crash",
    Celebration = "celebration",
}

@ccclass("Chicken")
export class Chicken extends Component {
    @property(sp.Skeleton)
    spineChicken: sp.Skeleton = null;

    private state = ChickenState.Idle;

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
        this.spineChicken.setMix("celebration", "idle", 0.2);
        this.spineChicken.setMix("crash", "idle", 0.2);
        this.spineChicken.setMix("moving", "idle", 0.2);
        this.spineChicken.setMix("moving", "final", 0.2);
    }

    async playAnim({ animName, loop, duration }: { animName: string; loop?: boolean; duration?: number }) {
        if (!this.spineChicken) {
            return;
        }
        this.state = animName as ChickenState;
        await AnimationUtils.playSpine(this.spineChicken, animName, loop, duration);
    }

    playIdle() {
        AudioUtils.playStoppableSFX(AudioIds.CHICKEN_IDLE, true);
        this.playAnim({ animName: "idle", loop: true });
    }

    async playStep() {
        await this.playAnim({ animName: "moving" });
    }

    async playStepSuccessAtLastLane() {
        await this.playStep();
        this.playAnim({ animName: "final" });
    }

    async playStepSuccess(hasVehicle = false) {
        await this.playStep();

        if (hasVehicle) {
            this.playAnim({ animName: "win" }).then(() => {
                this.changeToIdle();
            });
        } else {
            this.playAnim({ animName: "celebration" }).then(() => {
                this.changeToIdle();
            });
        }
    }

    private changeToIdle() {
        const shouldChangeToIdle = this.state !== ChickenState.Idle
            && this.state !== ChickenState.Crash
            && this.state !== ChickenState.Moving;
        if (shouldChangeToIdle) {
            this.playIdle();
        }
    }

    reset() {
        this.playIdle();
    }

    playCrash() {
        AudioUtils.playSFX(AudioIds.CAR_HIT);
        this.playAnim({ animName: "crash" });
    }
}
