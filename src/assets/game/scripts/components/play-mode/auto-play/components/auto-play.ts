import gc from "@sg/game-client-base";
import { _decorator, EditBox, instantiate, Label, Node, Prefab, sys } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { FixedStepsMultiplierConfig } from "../../../../game-configs/instant-win-config-store";
import { AutoPlayHandler } from "../auto-play-handler";
import { AutoPlayStore } from "../auto-play-store";
import AutoPlayItem from "./auto-play-item";

const { FormatUtils } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class AutoPlay extends ObserverComponent {
    @property(Node)
    autoPlayContainer: Node = null;

    @property(Node)
    bg: Node = null;

    @property(Node)
    btnMinus: Node = null;

    @property(Node)
    btnDisableMinus: Node = null;

    @property(Node)
    btnPlus: Node = null;

    @property(Node)
    btnDisablePlus: Node = null;

    @property(Node)
    btnCountdown: Node = null;

    @property(EditBox)
    numberOfLanesEditBox: EditBox = null;

    @property(Node)
    noOfAutoPlayItemContainer: Node = null;

    @property(Label)
    lblCountdown: Label = null;

    @property(Prefab)
    prfAutoPlayItem: Prefab = null;

    private currentConfig: FixedStepsMultiplierConfig = null;
    private maxNumberOfLanes = 0;

    onLoad() {
        super.onLoad();
        this.numberOfLanesEditBox.inputMode = EditBox.InputMode.NUMERIC;
        this.numberOfLanesEditBox.inputFlag = EditBox.InputFlag.DEFAULT;

        this.numberOfLanesEditBox.node.on(EditBox.EventType.EDITING_DID_BEGAN, () => {
            if (sys.isMobile) {
                this.numberOfLanesEditBox.focus();
            }
        });

        this.numberOfLanesEditBox.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEndNumberOfLanes, this);
        this.getCurrentMultiplierConfig();
    }

    @handle(AutoPlayHandler, (handler) => handler.getCurrentMultiplierConfig())
    getCurrentMultiplierConfig() {}

    private onEditEndNumberOfLanes() {
        let numberOfLanes = this.getInputNumberOfLanes();
        if (numberOfLanes < 1) {
            numberOfLanes = 1;
        }
        if (numberOfLanes > this.maxNumberOfLanes) {
            numberOfLanes = this.maxNumberOfLanes;
        }
        this.updateNumberOfLanes(numberOfLanes);
    }

    @render(AutoPlayStore, (store) => store.currentMultiplierConfig)
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        if (!currentMultiplierConfig) {
            return;
        }
        this.currentConfig = currentMultiplierConfig;
        this.maxNumberOfLanes = this.currentConfig.multiplierSteps.length;
        this.numberOfLanesEditBox.string = "1";
        this.updateNumberOfLanes(1);
    }

    @render(AutoPlayStore, (store) => store.roundsList)
    initContentRounds(roundsList: number[]) {
        for (const item of roundsList) {
            const node = instantiate(this.prfAutoPlayItem);
            this.noOfAutoPlayItemContainer.addChild(node);
            const itemComp = node.getComponent(AutoPlayItem);
            itemComp.setData(item);
        }
    }

    @render(AutoPlayStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        this.noOfAutoPlayItemContainer.children.forEach((child) => {
            const roundNumber = child.getComponent(AutoPlayItem);
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedNode(selectedBg);
        });
    }

    @handle(AutoPlayHandler, (handler, numberOfLanes: number) => handler.handleNoOfLanes(numberOfLanes))
    private updateNumberOfLanes(numberOfLanes: number) {
        this.numberOfLanesEditBox.string = numberOfLanes.toString();
        this.updateDisableButtons();
        return numberOfLanes;
    }

    onClickMinusButton() {
        this.playSoundClick();
        const updatedNumberOfLanes = this.getInputNumberOfLanes() - 1;
        this.updateNumberOfLanes(updatedNumberOfLanes);
    }

    onClickPlusButton() {
        this.playSoundClick();
        const updatedNumberOfLanes = this.getInputNumberOfLanes() + 1;
        this.updateNumberOfLanes(updatedNumberOfLanes);
    }

    private updateDisableButtons() {
        if (this.getInputNumberOfLanes() === 1) {
            this.btnDisableMinus.active = true;
        } else {
            this.btnDisableMinus.active = false;
        }

        if (this.getInputNumberOfLanes() === this.maxNumberOfLanes) {
            this.btnDisablePlus.active = true;
        } else {
            this.btnDisablePlus.active = false;
        }
    }

    private getInputNumberOfLanes() {
        return parseInt(this.numberOfLanesEditBox.string || "0");
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @handle(AutoPlayHandler, (handler) => handler.confirmRoundAndStart())
    private onClickStartAutoPlay() {
        this.playSoundClick();
    }

    private toggleAutoPlayPopup(isOpen = true) {
        this.playSoundClick();
        this.autoPlayContainer.active = isOpen;
        this.bg.active = isOpen;
    }

    @handle(AutoPlayHandler, (handler) => handler.closeAutoPlayPopup())
    private closePopup() {
        this.toggleAutoPlayPopup(false);
    }

    private openPopup() {
        this.toggleAutoPlayPopup(true);
    }
}
