import { _decorator, Component, Node, sp, tween, v3 } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
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

    @property(sp.Skeleton)
    hitEffect: sp.Skeleton = null;

    @property(sp.Skeleton)
    firework: sp.Skeleton = null;

    private state = ChickenState.Idle;

    onLoad() {
        this.initMix();
        this.playIdle();
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

    checkToPlaySoundIdle() {
        if (this.state === ChickenState.Idle) {
            AudioUtils.playStoppableSFX(AudioIds.CHICKEN_IDLE, true);
        }
    }

    playIdle() {
        this.playAnim({ animName: "idle", loop: true });
    }

    async playStep() {
        await this.playAnim({ animName: "moving" });
    }

    async playStepSuccessAtLastLane() {
        await this.playStep();
        await this.playAnimDance();
    }

    private async playAnimDance() {
        this.showFireWork();
        AudioUtils.playSFX(AudioIds.CHICKEN_DANCE);
        await this.playAnim({ animName: "final" });
    }

    private showFireWork() {
        this.firework.node.active = true;
        this.firework.setAnimation(0, "firework", true);
    }

    chickenSmile() {
        const animName = "celebration";
        this.playAnim({ animName }).then(() => {
            this.changeToIdle();
        });
    }

    chickenScare() {
        AudioUtils.playSFX(AudioIds.CHICKEN_SCREAM);
        this.state = ChickenState.Win;
        this.spineChicken.setAnimation(0, "win", false);
        const trackEntry = this.spineChicken.getCurrent(0);
        trackEntry.animationStart = 0.25;
        AnimationUtils.delayTime(0.6).then(() => {
            this.changeToIdle();
        });
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
        this.hideHitEffect();
        this.spineChicken.node.setPosition(v3(0, 0, 0));
        this.playIdle();
        this.firework.node.active = false;
    }

    async playCrash(parentNode: Node) {
        tween(this.spineChicken.node)
            .delay(0.3)
            .call(() => {
                const center = ComponentUtils.convertPosition(this.spineChicken.node.parent, parentNode);
                tween(this.spineChicken.node)
                    .to(0.3, { position: v3(center.x, 0, 0) })
                    .start();
            })
            .start();
        this.showHitEffect();
        await this.playAnim({ animName: "crash" });
    }

    showHitEffect() {
        this.hitEffect.node.active = true;
        this.hitEffect.setAnimation(0, "hit", false);
    }

    hideHitEffect() {
        this.hitEffect.node.active = false;
    }
}