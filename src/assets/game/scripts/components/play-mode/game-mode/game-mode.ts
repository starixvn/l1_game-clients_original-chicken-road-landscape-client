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

    @property(Node)
    buttonArrowDown: Node = null;

    private currentMultiplierConfig: FixedStepsMultiplierConfig;

    onLoad() {
        this.modeDialog.active = false;
        this.buttonArrowDown.active = false;
        super.onLoad();
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfigs(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        if (currentMultiplierConfig) {
            this.currentMultiplierConfig = currentMultiplierConfig;
            this.currentModeLbl.string = this.getMultiplierModeTranslate(this.currentMultiplierConfig.mode);
            this.updateSelectedMode(this.currentMultiplierConfig.mode);
        }
    }

    private updateSelectedMode(mode: number) {
        const selectedModeName = `${this.getStringModeValue(mode)}-mode`;
        for (const child of this.modeDialog.children) {
            if (child.name === selectedModeName) {
                child.getChildByName(`name-lbl`).active = false;
                child.getChildByName(`selected-name-lbl`).active = true;
            } else {
                child.getChildByName(`name-lbl`).active = true;
                child.getChildByName(`selected-name-lbl`).active = false;
            }
        }
    }

    private getMultiplierModeTranslate(mode: number) {
        let key = `difficulty_${this.getStringModeValue(mode)}`;
        return gc.Translator.gameTranslate(key);
    }

    private getStringModeValue(mode: number) {
        let value = "";
        switch (mode) {
            case 1:
                value = `easy`;
                break;
            case 2:
                value = `medium`;
                break;
            case 3:
                value = `hard`;
                break;
            case 4:
                value = `hardcore`;
        }
        return value;
    }

    @handle(InstantWinConfigHandler, (handler, mode: number) => handler.setCurrentMultiplierConfig(mode))
    private setCurrentMultiplierMode(event: any, mode: string) {
        this.toggleModeDialog(false);
        return +mode;
    }

    private toggleModeDialog(show = true) {
        this.modeDialog.active = show;
        this.buttonArrowDown.active = show;
    }
}
