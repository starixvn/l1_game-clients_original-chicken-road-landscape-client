import gc from "@sg/game-client-base";
import { _decorator, BlockInputEvents, EditBox, UIOpacity } from "cc";
import { ClientSeedSettingsPopup as ClientSeedSettingsPopupRoundBase } from "db://shared-components/provably-fair/round-base/scripts/client-seed-settings-popup";
import Observer from "observer";
import { AutoPlayStore } from "../play-mode/auto-play";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class ChickenRoadPFClientSeedSettingsPopup extends ClientSeedSettingsPopupRoundBase {
    @property(EditBox)
    private readonly inputManualSeed: EditBox = null;

    private isAutoPlay = false;
    private randomClientSeedEnabled = true;

    onLoad() {
        this.setupInputListeners();
        super.onLoad();
    }

    @render(AutoPlayStore, (store) => store.isAutoplay)
    renderIsAutoPlay(isAutoPlay: boolean) {
        this.isAutoPlay = isAutoPlay;
        this.updateManualInputEditBox();
    }

    private setupInputListeners() {
        this.inputManualSeed.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEndManualSeed, this);
    }

    private setManualInputInterractable(enabled: boolean) {
        const opacity = enabled ? this.OPACITY_ENABLED : this.OPACITY_DISABLED;
        this.inputManualSeed.enabled = enabled;
        this.inputManualSeed.node.getComponent(UIOpacity).opacity = opacity;

        let blocker = this.inputManualSeed.node.getComponent(BlockInputEvents);
        if (!blocker) {
            blocker = this.inputManualSeed.node.addComponent(BlockInputEvents);
        }
        blocker.enabled = !enabled;
    }

    private updateRandomLabelOpacity(enabled: boolean) {
        this.lblRandomClientSeed.node.getComponent(UIOpacity).opacity = enabled ? this.OPACITY_ENABLED : this.OPACITY_DISABLED;
    }

    clickManualOption() {
        const randomCS = this.lblRandomClientSeed.string;
        this.inputManualSeed.string = randomCS;
        this.setManualInputInterractable(true);
        this.updateValueManualMode(randomCS);
        this.clickManualMode();
    }

    clickAutoOption() {
        this.inputManualSeed.string = "";
        this.setManualInputInterractable(false);
        this.clickRandomMode();
    }

    private onEditEndManualSeed() {
        let manualInputValue = this.inputManualSeed.string;

        // Remove any non-numeric characters (extra safety)
        manualInputValue = manualInputValue.replace(/\D/g, "");

        // Limit to 4 digits (extra safety)
        if (manualInputValue.length > 4) {
            manualInputValue = manualInputValue.substring(0, 4);
        }

        // Update the input field with cleaned value
        this.inputManualSeed.string = manualInputValue;

        if (manualInputValue) {
            this.updateValueManualMode(manualInputValue);
        }
    }

    updateManualClientSeed(manualClientSeed: string) {
        this.inputManualSeed.string = manualClientSeed;
    }

    setDisplayManualClientSeedPopup(showManualClientSeedPopup: boolean) { }

    @render(gc.Bet.BetStore, (store) => store.lastReceivedBet, { fireImmediately: false })
    closeSettingPopup(lastReceivedBet: gc.Bet.ILastReceivedBet) {
        if (lastReceivedBet?.value > 0) {
            this.closeSettingsPopup();
        }
    }

    updateRandomMode(randomClientSeedEnabled: boolean) {
        this.randomClientSeedEnabled = randomClientSeedEnabled;
        super.updateRandomMode(randomClientSeedEnabled);
        this.updateManualInputEditBox();
    }

    updateManualInputEditBox() {
        const manualEnabled = !this.randomClientSeedEnabled && !this.isAutoPlay;
        this.setManualInputInterractable(manualEnabled);
    }

    setDisplayContentRandomMode(selectedRandomMode: boolean) {
        if (this.isAutoPlay && !selectedRandomMode) {
            return;
        }
        super.setDisplayContentRandomMode(selectedRandomMode);
    }

    setDisplayContentManualMode(allowChangeManualClientSeed: boolean) {
        if (this.isAutoPlay && allowChangeManualClientSeed) {
            return;
        }
        super.setDisplayContentManualMode(allowChangeManualClientSeed);
    }
}
