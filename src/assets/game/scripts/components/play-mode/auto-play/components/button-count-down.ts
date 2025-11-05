import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AutoPlayHandler } from "../auto-play-handler";
import { AutoPlayStore } from "../auto-play-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export default class ButtonCountDown extends ObserverComponent {
    @property(Node)
    btnCountdown: Node = null;

    @property(Label)
    lblCountdown: Label = null;

    onLoad() {
        super.onLoad();
        this.btnCountdown.active = false;
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    renderCountdown(countdown: number) {
        if (countdown < 0) {
            return;
        }
        this.lblCountdown.string = countdown.toString();
    }

    @render(AutoPlayStore, (store) => store.isAutoplay)
    renderButton(enable: boolean) {
        this.btnCountdown.active = enable;
    }

    @handle(AutoPlayHandler, (handler) => handler.cancelAutoPlay())
    onClick() {
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
