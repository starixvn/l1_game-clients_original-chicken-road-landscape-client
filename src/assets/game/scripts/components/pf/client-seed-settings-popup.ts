import gc from "@sg/game-client-base";
import { _decorator, EditBox, UIOpacity } from "cc";
import { ClientSeedSettingsPopup } from "db://shared-components/game-crash/provably-fair/scripts/client-seed-settings-popup";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class ClientSeedSettingsDirectPopup extends ClientSeedSettingsPopup {
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
        const opacity = enabled ? ClientSeedSettingsDirectPopup.OPACITY_ENABLED : ClientSeedSettingsDirectPopup.OPACITY_DISABLED;
        this.inputManualSeed.enabled = enabled;
        this.inputManualSeed.node.getComponent(UIOpacity).opacity = opacity;
    }

    private updateRandomLabelOpacity(enabled: boolean) {
        this.lblRandomClientSeed.node.getComponent(UIOpacity).opacity = enabled ?
            ClientSeedSettingsDirectPopup.OPACITY_ENABLED :
            ClientSeedSettingsDirectPopup.OPACITY_DISABLED;
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
        const manualInputValue = this.inputManualSeed.string;
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
