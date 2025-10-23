import gc from "@sg/game-client-base";
import { _decorator, EditBox, UIOpacity } from "cc";
import { ClientSeedSettingsPopup as ClientSeedSettingsPopupRoundBase } from "db://shared-components/provably-fair/round-base/scripts/client-seed-settings-popup";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class ChickenRoadPFClientSeedSettingsPopup extends ClientSeedSettingsPopupRoundBase {
    @property(EditBox)
    private readonly inputManualSeed: EditBox = null;

    private static readonly OPACITY_DISABLED = 153;
    private static readonly OPACITY_ENABLED = 255;

    onLoad() {
        this.setupInputListeners();
        super.onLoad();
    }

    private setupInputListeners() {
        this.inputManualSeed.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEndManualSeed, this);
    }

    private updateInputOpacity(enabled: boolean) {
        const opacity = enabled ? ChickenRoadPFClientSeedSettingsPopup.OPACITY_ENABLED : ChickenRoadPFClientSeedSettingsPopup.OPACITY_DISABLED;
        this.inputManualSeed.enabled = enabled;
        this.inputManualSeed.node.getComponent(UIOpacity).opacity = opacity;
    }

    private updateRandomLabelOpacity(enabled: boolean) {
        this.lblRandomClientSeed.node.getComponent(UIOpacity).opacity = enabled ?
            ChickenRoadPFClientSeedSettingsPopup.OPACITY_ENABLED :
            ChickenRoadPFClientSeedSettingsPopup.OPACITY_DISABLED;
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
        manualInputValue = manualInputValue.replace(/\D/g, '');
        
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

}
