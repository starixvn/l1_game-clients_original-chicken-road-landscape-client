import gc from "@sg/game-client-base";
import { _decorator, EditBox, UIOpacity } from "cc";
import { ClientSeedSettingsPopup as ClientSeedSettingsPopupRoundBase } from "db://shared-components/provably-fair/round-base/scripts/client-seed-settings-popup";
import Observer from "observer";
import { PfStore } from "./pf-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class ChickenRoadPFClientSeedSettingsPopup extends ClientSeedSettingsPopupRoundBase {
    @property(EditBox)
    private readonly inputManualSeed: EditBox = null;

    private isAutoPlay = false;

    onLoad() {
        this.setupInputListeners();
        super.onLoad();
    }

    @render(PfStore, (store) => store.isAutoplay)
    renderIsAutoPlay(isAutoPlay: boolean) {
        this.isAutoPlay = isAutoPlay;
    }

    private setupInputListeners() {
        this.inputManualSeed.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEndManualSeed, this);
    }

    private updateInputOpacity(enabled: boolean) {
        const opacity = enabled ? this.OPACITY_ENABLED : this.OPACITY_DISABLED;
        this.inputManualSeed.enabled = enabled && !this.isAutoPlay;
        this.inputManualSeed.node.getComponent(UIOpacity).opacity = opacity;
    }

    private updateRandomLabelOpacity(enabled: boolean) {
        this.lblRandomClientSeed.node.getComponent(UIOpacity).opacity = enabled ? this.OPACITY_ENABLED : this.OPACITY_DISABLED;
    }

    clickManualOption() {
        const randomCS = this.lblRandomClientSeed.string;
        this.inputManualSeed.string = randomCS;
        this.updateValueManualMode(randomCS);
        this.clickManualMode();
    }

    clickAutoOption() {
        this.inputManualSeed.string = "";
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

    setDisplayManualClientSeedPopup(showManualClientSeedPopup: boolean) {}

    @render(gc.Bet.BetStore, (store) => store.lastReceivedBet, { fireImmediately: false })
    closeSettingPopup(lastReceivedBet: gc.Bet.ILastReceivedBet) {
        if (lastReceivedBet?.value > 0) {
            this.closeSettingsPopup();
        }
    }

    updateRandomMode(randomClientSeedEnabled: boolean) {
        super.updateRandomMode(randomClientSeedEnabled);
        this.updateInputOpacity(!randomClientSeedEnabled);
    }

    setDisplayComponents(notAllowChangeClientSeed: boolean) {
        if (notAllowChangeClientSeed) {
            this.nodeRandomLabelDisabledBg.active = true;
            this.nodeManualLabelDisabledBg.active = true;
            this.tglManualClientSeed.node.getComponent(UIOpacity).opacity = this.OPACITY_DISABLED;
            this.tglRandomClientSeed.node.getComponent(UIOpacity).opacity = this.OPACITY_DISABLED;
            this.tglManualClientSeed.interactable = false;
            this.tglRandomClientSeed.interactable = false;
            this.inputManualSeed.enabled = false;
            this.nodeWarningText.active = true;
        } else {
            if (this.isAutoPlay) {
                return;
            }
            this.nodeRandomLabelDisabledBg.active = false;
            this.nodeManualLabelDisabledBg.active = false;
            this.tglManualClientSeed.node.getComponent(UIOpacity).opacity = this.OPACITY_ENABLED;
            this.tglRandomClientSeed.node.getComponent(UIOpacity).opacity = this.OPACITY_ENABLED;
            this.tglManualClientSeed.interactable = true;
            this.tglRandomClientSeed.interactable = true;
            this.inputManualSeed.enabled = true;
            this.nodeWarningText.active = false;
        }
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
