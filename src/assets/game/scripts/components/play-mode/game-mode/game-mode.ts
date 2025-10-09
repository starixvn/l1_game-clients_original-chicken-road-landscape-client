import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { FixedStepsMultiplierConfig, InstantWinConfigHandler, InstantWinConfigStore } from "../../../game-configs";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("GameMode")
export class GameMode extends ObserverComponent {
    @property(Node)
    modeDialog: Node = null;

    @property(Label)
    currentModeLbl: Label = null;

    private currentMultiplierConfig: FixedStepsMultiplierConfig;

    onLoad() {
        super.onLoad();
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfigs(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        if (currentMultiplierConfig) {
            this.currentMultiplierConfig = currentMultiplierConfig;
            this.currentModeLbl.string = this.getMultiplierModeTranslate(this.currentMultiplierConfig.mode);
        }
    }

    private getMultiplierModeTranslate(mode: number) {
        let key = "difficulty_";
        switch (mode) {
            case 1:
                key += `easy`;
                break;
            case 2:
                key += `medium`;
                break;
            case 3:
                key += `hard`;
                break;
            case 4:
                key += `hardcore`;
                break;
            default:
                key += `easy`;
                break;
        }
        return gc.Translator.gameTranslate(key);
    }

    @handle(InstantWinConfigHandler, (handler, mode: number) => handler.setCurrentMultiplierConfig(mode))
    private setCurrentMultiplierMode(event: any, mode: string) {
        this.toggleModeDialog(false);
        return +mode;
    }

    private toggleModeDialog(show = true) {
        this.modeDialog.active = show;
    }
}
