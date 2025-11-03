import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AutoPlayHandler } from "../auto-play-handler";
import { AutoPlayStore } from "../auto-play-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export default class ButtonAutoPlay extends ObserverComponent {
    @property(Node)
    btnAutoPlay: Node = null;

    onLoad() {
        super.onLoad();
    }

    @render(AutoPlayStore, (store) => store.isAutoplay)
    renderButton(enable: boolean) {
        this.btnAutoPlay.active = !enable;
    }

    @handle(AutoPlayHandler, (handle) => handle.clickAutoPlay())
    onClickAutoPlay() {
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
