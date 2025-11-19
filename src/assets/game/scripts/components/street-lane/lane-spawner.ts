import gc from "@sg/game-client-base";
import { _decorator, Color, instantiate, Node, Prefab, ScrollView, tween, UITransform, v2, v3 } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AudioIds } from "../../../audios/AudioIds";
import { CrashUtils } from "../../crash-utils";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
import { settings } from "../../game-settings";
import { BetHandler } from "../bets/bet-handler";
import { BetStore, BetUIState } from "../bets/bet-store";
import { Chicken } from "../chicken/chicken";
import { AutoPlayHandler } from "../play-mode/auto-play/auto-play-handler";
import LaneItem from "./lane-item";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

const BG_MULTIPLIER_COLOR_INDEX = {
    DEFAULT: 0,
    NEXT_STEP: 1,
    CURRENT_STEP: 2,
};

@ccclass("LaneSpawner")
export class LaneSpawner extends ObserverComponent {
    @property(Prefab)
    lanePrefab: Prefab = null;

    @property(Node)
    laneContent: Node = null;

    @property(Node)
    chickenNode: Node = null;

    @property(Node)
    startPoint: Node = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    private chickenCtrl: Chicken = null;
    private laneWidth = 0;
    private currentLaneIndex = -1;
    private currentConfig: FixedStepsMultiplierConfig;
    private interrupted = false;

    private decor1Index = -1;
    private decor2Index = -1;

    onLoad() {
        this.laneContent.removeAllChildren();
        super.onLoad();
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        const previousConfig = this.currentConfig;
        this.currentConfig = currentMultiplierConfig;
        if (this.currentConfig) {
            this.renderLane(previousConfig);
        }
    }

    renderLane(previousConfig: FixedStepsMultiplierConfig) {
        this.spawnLanes(previousConfig?.multiplierSteps?.length ?? 0);

        if (this.chickenNode) {
            this.chickenCtrl = this.chickenNode.getComponent(Chicken);
            this.spawnChickenAtStart();
        }
    }

    spawnLanes(previousLength: number) {
        if (!this.lanePrefab || !this.laneContent || !this.currentConfig) {
            return;
        }

        if (previousLength === 0) {
            this.createAllLanes();
        } else {
            this.adjustLaneCount(previousLength);
        }

        this.generateRandomDecorIndices(this.currentConfig.multiplierSteps.length);

        this.laneWidth = this.lanePrefab.data.getComponent(UITransform).width;
        this.configureLanes();
    }

    private createAllLanes() {
        for (let index = 0; index < this.currentConfig.multiplierSteps.length; index++) {
            const lane = instantiate(this.lanePrefab);
            lane.name = `lane-${index.toString().padStart(2, "0")}`;
            this.laneContent.addChild(lane);
        }
    }

    private adjustLaneCount(previousLength: number) {
        const currentLength = this.currentConfig.multiplierSteps.length;
        const lengthDifference = Math.abs(currentLength - previousLength);

        if (previousLength > currentLength) {
            this.removeLanes(lengthDifference);
        } else if (previousLength < currentLength) {
            this.addLanes(lengthDifference);
        }
    }

    private removeLanes(count: number) {
        const startIndex = this.laneContent.children.length - 1;
        const endIndex = startIndex - count;
        for (let index = startIndex; index > endIndex; index--) {
            this.laneContent.children[index].destroy();
        }
    }

    private addLanes(count: number) {
        const startIndex = this.laneContent.children.length;
        const endIndex = startIndex + count;
        for (let index = startIndex; index < endIndex; index++) {
            const lane = instantiate(this.lanePrefab);
            lane.name = `lane-${index.toString().padStart(2, "0")}`;
            this.laneContent.addChild(lane);
        }
    }

    private configureLanes() {
        for (let index = 0; index < this.currentConfig.multiplierSteps.length; index++) {
            const multiplier = this.currentConfig.multiplierSteps[index];
            const landItem = this.laneContent.children[index]?.getComponent(LaneItem);

            if (!landItem) {
                continue;
            }

            const isFirst = index === 0;
            const isLast = index === this.currentConfig.multiplierSteps.length - 1;

            landItem.configGrate(isFirst, isLast);

            const showDecor1 = index === this.decor1Index;
            const showDecor2 = index === this.decor2Index;
            landItem.configDecors(showDecor1, showDecor2);

            landItem.setMultiplier(multiplier);
            if (index === 0) {
                landItem.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.NEXT_STEP));
                landItem.isClickable = true;
            } else {
                landItem.startRandomSpawning();
            }
        }
    }

    private generateRandomDecorIndices(totalLanes: number) {
        this.decor1Index = -1;
        this.decor2Index = -1;

        if (totalLanes < 2) {
            return;
        }

        const availableIndices = Array.from({ length: totalLanes }, (_, i) => i);

        const randomIndex1 = Math.floor(Math.random() * availableIndices.length); //NOSONAR
        this.decor1Index = availableIndices[randomIndex1];

        availableIndices.splice(randomIndex1, 1);

        const randomIndex2 = Math.floor(Math.random() * availableIndices.length); //NOSONAR
        this.decor2Index = availableIndices[randomIndex2];
    }

    spawnChickenAtStart() {
        this.resetChicken();
        this.currentLaneIndex = -1;
    }

    moveChicken() {
        const nextLaneIndex = this.currentLaneIndex + 1;
        if (!this.laneContent.children[nextLaneIndex]) {
            return;
        }

        this.currentLaneIndex = nextLaneIndex;
        const lane = this.laneContent.children[nextLaneIndex];

        const laneWorld = lane.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);
        AudioUtils.playSFX(AudioIds.JUMP);
        console.log("chicken move");
        tween(this.chickenNode)
            .delay(0.3)
            .call(() => {
                this.scrollToLane(localPos.x, 0.7);
            })
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .start();
    }

    stopSpawningVehicleNextLane() {
        const landItem = this.laneContent.children[this.currentLaneIndex + 1];
        if (landItem) {
            const landItemComponent = landItem.getComponent(LaneItem);
            if (landItemComponent) {
                landItemComponent.stopSpawningVehicle();
            }
        }
    }

    scrollToLane(offset: number, duration: number) {
        this.scrollView.scrollToOffset(v2(offset - this.laneWidth / 2, 0), duration, true);
    }

    @render(BetStore, (store) => store.multiplier)
    async updateMultiplier(multiplier) {
        if (!this.chickenCtrl) {
            return;
        }
        try {
            const minMultiplier = this.currentConfig.multiplierSteps[0];

            this.interrupted = false;
            if (multiplier < minMultiplier) {
                this.updateCurrentLaneItemBackground();
                return;
            }
            this.setUIAnimatingState();
            const nextLane = this.currentLaneIndex + 1;
            const isFinalLane = nextLane === this.currentConfig.multiplierSteps.length - 1;
            this.updateCurrentLaneItemBackground();

            const hasVehicle = Math.random() < 0.8; //NOSONAR
            this.moveChicken();
            this.stopSpawningVehicleNextLane();
            this.scheduleOnce(() => this.showBarrier(nextLane, hasVehicle && !isFinalLane), settings.durations.stepAnimation);
            if (isFinalLane) {
                await this.chickenCtrl.playStepSuccessAtLastLane();
                this.setSettleState();
            } else {
                await this.chickenCtrl.playStepSuccess(hasVehicle);
            }
            this.updateCurrentAndNextLaneItemBackground();

            this.setUIMiningState();

            if (this.interrupted) {
                this.completeSettle();
            } else {
                this.checkPlaceBetNextRound();
            }
            this.interrupted = false;
        } catch (e) { }
    }

    @handle(AutoPlayHandler, (handler) => handler.completeSettle())
    completeSettle() { }

    @render(AutoPlayHandler, (handler) => handler.interrupted, { fireImmediately: false })
    renderInterrupted(interrupted: any) {
        if (interrupted) {
            this.interrupted = true;
        }
    }

    @handle(BetHandler, (handler) => handler.setUIMiningState())
    setUIMiningState() { }

    @handle(BetHandler, (handler) => handler.setSettleState())
    setSettleState() { }

    @handle(BetHandler, (handler) => handler.setUIAnimatingState())
    setUIAnimatingState() { }

    @handle(AutoPlayHandler, (handle) => handle.checkAutoBetNextRound())
    checkPlaceBetNextRound() { }

    showBarrier(landIndex: number, hasVehicle = false) {
        try {
            const landItem = this.laneContent.children[landIndex];
            if (landItem) {
                const landItemComponent = landItem.getComponent(LaneItem);
                landItemComponent?.playStepSuccess(hasVehicle);
            }
        } catch (error) { }
    }

    updateCurrentLaneItemBackground() {
        const previousLandItem = this.laneContent.children[this.currentLaneIndex];
        if (previousLandItem) {
            const landItemComponent = previousLandItem.getComponent(LaneItem);
            if (landItemComponent) {
                landItemComponent.toggleCurrentMultiplierBackground(false);
            }
        }
    }

    updateCurrentAndNextLaneItemBackground() {
        const currentLandItem = this.laneContent.children[this.currentLaneIndex];
        if (currentLandItem) {
            const landItemComponent = currentLandItem.getComponent(LaneItem);
            if (landItemComponent) {
                landItemComponent.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.CURRENT_STEP));
                landItemComponent.toggleCurrentMultiplierBackground();
                landItemComponent.isClickable = false;
            }
        }

        const nextLandItem = this.laneContent.children[this.currentLaneIndex + 1];
        if (nextLandItem) {
            const landItemComponent = nextLandItem.getComponent(LaneItem);
            if (landItemComponent) {
                landItemComponent.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.NEXT_STEP));
                landItemComponent.isClickable = true;
            }
        }
    }

    @render(BetStore, (store) => store.uiState, { fireImmediately: false })
    updateUIState(uiState: BetUIState) {
        if (uiState === BetUIState.Start) {
            this.currentLaneIndex = -1;
            this.reset();
        }
    }

    @render(BetStore, (store) => store.settleStatus, { fireImmediately: false })
    async handleWinStatus(settleStatus: any) {
        if (!settleStatus || !this.chickenCtrl) {
            return;
        }

        try {
            if (!settleStatus.win) {
                this.moveChicken();
                const landItem = this.laneContent.children[this.currentLaneIndex];
                if (landItem) {
                    const landItemComponent = landItem.getComponent(LaneItem);
                    landItemComponent?.playCrashVehicle(() => {
                        this.chickenCtrl.playCrash();
                    });
                }
                this.chickenCtrl.playStep();
            }
        } catch (e) { }
    }

    private reset() {
        this.resetLandItemsBackground();
        this.resetChicken();
        this.scrollView.scrollToLeft(0.2);
    }

    private getStartPosition() {
        const startWorld = this.startPoint.worldPosition;
        const parent = this.chickenNode.parent;
        return parent.getComponent(UITransform).convertToNodeSpaceAR(startWorld);
    }

    private resetChicken() {
        const startPos = this.getStartPosition();
        this.chickenNode.setPosition(startPos);
        this.chickenCtrl.reset();
    }

    private resetLandItemsBackground() {
        const landItems = this.laneContent.children;
        for (let index = 0; index < landItems.length; index++) {
            const landItem = landItems[index];
            const landItemComponent = landItem.getComponent(LaneItem);
            landItemComponent.toggleCurrentMultiplierBackground(false);
            landItemComponent.resetLaneItem();
            if (index === 0) {
                landItemComponent.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.NEXT_STEP));
                landItemComponent.isClickable = true;
            } else {
                landItemComponent.setMultiplierStyle(LaneItem.DEFAULT_TEXT_COLOR, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.DEFAULT));
                landItemComponent.startRandomSpawning();
            }
        }
    }

    // @render(gc.App.AppStore, (store) => store.isTouchedScreen || store.isUserGesture)
    // setUserGesture(isTouchedScreen: boolean): void {
    //     if (isTouchedScreen) {
    //         this.chickenCtrl.checkToPlaySoundIdle();
    //     }
    // }
}
