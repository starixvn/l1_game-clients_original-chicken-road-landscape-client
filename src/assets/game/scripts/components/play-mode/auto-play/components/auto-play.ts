import gc from "@sg/game-client-base";
import { _decorator, Button, EditBox, instantiate, Node, Prefab, sys } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
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

    @property(Button)
    btnMinus: Button = null;

    @property(Button)
    btnPlus: Button = null;

    @property(EditBox)
    numberOfLanesEditBox: EditBox = null;

    @property(Node)
    noOfAutoPlayItemContainer: Node = null;

    @property(Prefab)
    prfAutoPlayItem: Prefab = null;

    private maxNumberOfLanes = 0;

    onLoad() {
        super.onLoad();
        this.numberOfLanesEditBox.inputMode = EditBox.InputMode.NUMERIC;
        this.numberOfLanesEditBox.inputFlag = EditBox.InputFlag.DEFAULT;

        this.numberOfLanesEditBox.node.on(EditBox.EventType.EDITING_DID_BEGAN, this.onEditBegin, this);
        this.numberOfLanesEditBox.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onEditEndNumberOfLanes, this);
    }

    private onEditBegin(editBox: EditBox) {
        const text = editBox.string;
        const cleanText = text.replace(/,/g, "").replace(/x/g, "");
        const numValue = Number(cleanText);
        editBox.string = isNaN(numValue) ? "" : numValue.toString();
    }

    private getInputNumberOfLanes() {
        return parseInt(this.numberOfLanesEditBox.string || "0");
    }

    private onEditEndNumberOfLanes() {
        let numberOfLanes = this.getInputNumberOfLanes();
        if (numberOfLanes < 1) {
            numberOfLanes = 1;
        }
        if (numberOfLanes > this.maxNumberOfLanes) {
            numberOfLanes = this.maxNumberOfLanes;
        }
        if (!/^\d+$/.test(this.numberOfLanesEditBox.string)) {
            this.numberOfLanesEditBox.string = numberOfLanes.toString();
        }
        this.updateNumberOfLanes(numberOfLanes);
    }

    @render(AutoPlayStore, (store) => store.currentMultiplierConfig)
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        if (!currentMultiplierConfig) {
            return;
        }
        this.maxNumberOfLanes = currentMultiplierConfig.multiplierSteps.length;
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

    @render(AutoPlayStore, (store) => store.noOfLanes)
    renderNoOfLanes(noOfLanes: number) {
        this.numberOfLanesEditBox.string = noOfLanes.toString();
    }

    @handle(AutoPlayHandler, (handler, numberOfLanes: number) => handler.handleNoOfLanes(numberOfLanes))
    private updateNumberOfLanes(numberOfLanes: number) {
        return numberOfLanes;
    }

    @handle(AutoPlayHandler, (handler) => handler.decreaseNoOfLanes())
    onClickMinusButton() {
        AudioUtils.playClick();
    }

    @handle(AutoPlayHandler, (handler) => handler.increaseNoOfLanes())
    onClickPlusButton() {
        AudioUtils.playClick();
    }

    @render(AutoPlayStore, (store) => store.canIncreaseNoOfLanes)
    renderInteractableBtnIncrease(canIncreaseNoOfLanes: boolean) {
        this.btnPlus.interactable = canIncreaseNoOfLanes;
    }

    @render(AutoPlayStore, (store) => store.canDecreaseNoOfLanes)
    renderInteractableBtnDecrease(canDecreaseNoOfLanes: boolean) {
        this.btnMinus.interactable = canDecreaseNoOfLanes;
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
    closePopup() {
        AudioUtils.playClick();
    }
}
