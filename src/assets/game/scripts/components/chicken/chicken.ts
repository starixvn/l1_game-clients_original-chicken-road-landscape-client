import { _decorator, Node, sp, tween, v3, Vec3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass("ChickenController")
export class ChickenController extends ObserverComponent {
    @property(sp.Skeleton)
    spineChicken: sp.Skeleton = null;

    private startPos: Vec3 = v3(0, 0, 0);
    private isCrashing = false;

    onLoad() {
        this.initMix();
        super.onLoad();
    }

    initMix() {
        if (!this.spineChicken) {
            return;
        }

        this.spineChicken.setMix("idle", "moving", 0.2);
        this.spineChicken.setMix("moving", "win", 0.2);
        this.spineChicken.setMix("moving", "crash", 0.2);
        this.spineChicken.setMix("win", "idle", 0.2);
        this.spineChicken.setMix("crash", "idle", 0.2);
        this.spineChicken.setMix("moving", "idle", 0.2);
    }

    async playAnim({ animName, loop, duration }: { animName: string; loop: boolean; duration?: number }) {
        if (!this.spineChicken) {
            return;
        }
        await AnimationUtils.playSpine(this.spineChicken, animName, loop, duration);
    }

    playIdle() {
        this.playAnim({ animName: "idle", loop: true });
    }

    playStep() {
        this.playAnim({ animName: "moving", loop: false });
    }

    playCrash() {
        this.playAnim({ animName: "crash", loop: false });
    }

    async playStepSuccess() {
        console.log("playStepSuccess");
        await this.playAnim({ animName: "moving", loop: false });
        await this.playAnim({ animName: "win", loop: false });
    }

    async playStepFail() {
        console.log("playStepFail");
        await this.playAnim({ animName: "moving", loop: false });
        await this.playAnim({ animName: "crash", loop: false });
    }

    setStartPos(pos: Vec3) {
        this.startPos = pos.clone();
    }

    /** Gọi khi crash → anim + move vào giữa scene + reset */
    async playCrashAtCenter(centerNode: Node) {
        if (this.isCrashing) {
            return;
        }
        this.isCrashing = true;

        // Lấy vị trí giữa màn hình (theo Node)
        const midWorld = v3(0, 0, 0);
        centerNode.getWorldPosition(midWorld);

        // Di chuyển gà ra giữa
        tween(this.node)
            .to(0.3, { worldPosition: midWorld })
            .call(async () => {
                this.playStepFail();
                // Giữ anim crash 3s
                await new Promise((res) => setTimeout(res, 3000));
                // Reset về start point
                tween(this.node)
                    .to(0.3, { position: this.startPos })
                    .call(() => {
                        this.playIdle();
                        this.isCrashing = false;
                    })
                    .start();
            })
            .start();
    }
}
