import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AutoPlayHandler } from "../auto-play-handler";

const { FormatUtils } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class AutoPlayItem extends ObserverComponent {
    @property(Label)
    lblNoOfAutoPlay: Label = null;

    @property(Node)
    nodeSelectedBg: Node = null;

    get value() {
        return +this.node.name;
    }

    @handle(AutoPlayHandler, (handler, noOfAutoPlay: number) => handler.updateNoOfRounds(noOfAutoPlay))
    onClickItem() {
        this.playSoundClick();
        return +this.value;
    }

    setData(noOfRound: number) {
        this.lblNoOfAutoPlay.string = noOfRound.toString();
        this.node.name = noOfRound.toString();
    }

    setSelectedNode(isSelected: boolean) {
        this.nodeSelectedBg.active = isSelected;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
