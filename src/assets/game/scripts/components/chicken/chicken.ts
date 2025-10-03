import gc from "@sg/game-client-base";
import { _decorator, sp, tween, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { BetStore } from "../bets/bet-store";
const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass("ChickenController")
export class ChickenController extends ObserverComponent {
    @property(sp.Skeleton)
    spineChicken: sp.Skeleton = null;

    currentLane = 0;
    laneWidth = 200;

    async playAnim(animName: string, loop: boolean) {
        if (!this.spineChicken) return;
        await AnimationUtils.playSpine(this.spineChicken, animName, loop);
    }

    playIdle() {
        this.playAnim("idle", true);
    }

    playStep() {
        this.playAnim("moving", false);
    }

    playCrash() {
        this.playAnim("crash", false);
    }

    onLoad() {
        this.playIdle();
        super.onLoad();
    }
}