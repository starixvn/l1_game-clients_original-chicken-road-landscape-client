import gc from "@sg/game-client-base";
import { _decorator, Component, Label, sp, tween, Vec3 } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("GameWinNotice")
export class GameWinNotice extends Component {
    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null;

    @property(Label)
    lblWin: Label = null;

    @property
    animationName = "";

    durationShowing = 1.5;

    onLoad(): void {
        this.node.active = false;
    }

    floatNumber(value: number, duration: number) {
        const temp = {
            value: 0,
        };

        tween(temp)
            .to(
                duration - this.durationShowing,
                { value: value },
                {
                    onUpdate: (target) => {
                        this.lblWin.string = `${gc.FormatUtils.numberWithCommas(target.value, 2, false)}`;
                    },
                }
            )
            .call(() => {
                this.lblWin.string = `${gc.FormatUtils.numberWithCommas(value, 2, false)}`;
                this.zooming();
            })
            .delay(this.durationShowing)
            .call(() => {
                this.hide();
            })
            .start();
    }

    zooming() {
        const scale = this.lblWin.node.scale.x;
        tween(this.lblWin.node)
            .delay(0.2)
            .to(0.4, { scale: new Vec3(1, 1, 1).multiplyScalar(scale * 1.5) }, { easing: "sineOut" })
            .to(0.2, { scale: new Vec3(1, 1, 1).multiplyScalar(scale) }, { easing: "backOut" })
            .start();
    }

    async hide() {
        try {
            await AnimationUtils.fadeOut(this.node, 0.3);
            this.node.active = false;
        } catch (e) {}
    }

    show(winValue: number, duration: number) {
        this.node.active = true;
        AnimationUtils.setOpacityNode(this.node, 255);

        this.skeleton?.setAnimation(0, this.animationName, true);
        this.floatNumber(winValue, duration);
    }
}
