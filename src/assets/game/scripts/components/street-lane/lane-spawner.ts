import { _decorator, Color, instantiate, Node, Prefab, ScrollView, tween, UITransform, v2, v3 } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../audios/AudioIds";
import { CrashUtils } from "../../crash-utils";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
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

    @property
    offsetLane = 0;

    private chickenCtrl: Chicken = null;
    private laneWidth = 0;
    private currentLaneIndex = -1;
    private currentConfig: FixedStepsMultiplierConfig;
    private interrupted = false;

    private decor1Index = -1;
    private decor2Index = -1;

    private readonly DEFAULT_INIT_LANES = 5;

    onLoad() {
        this.chickenCtrl = this.chickenNode.getComponent(Chicken);
        this.laneWidth = this.lanePrefab.data.getComponent(UITransform).width;

        this.initLanes();
        super.onLoad();
    }

    initLanes() {
        this.laneContent.removeAllChildren();
        this.spawnLanes(this.DEFAULT_INIT_LANES);
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    renderMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        if (!currentMultiplierConfig) {
            return;
        }
        this.currentConfig = currentMultiplierConfig;
        this.spawnLanes(this.currentConfig.multiplierSteps?.length ?? 0);
        this.generateRandomDecorIndices(this.currentConfig.multiplierSteps.length);
        this.configureLanes();
        this.spawnChickenAtStart();
    }

    spawnLanes(newLength: number) {
        this.adjustLaneCount(newLength);
    }

    private adjustLaneCount(newLength: number) {
        const currentLength = this.laneContent.children.length;
        const lengthDifference = Math.abs(currentLength - newLength);

        if (newLength > currentLength) {
            this.addLanes(lengthDifference);
        } else if (newLength < currentLength) {
            this.removeLanes(lengthDifference);
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
            const landItem = this.getLaneItem(index);

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
        tween(this.chickenNode)
            .delay(0.3)
            .call(() => {
                this.scrollToLane(localPos.x, 0.7);
            })
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .start();
    }

    moveChickenToPavement() {
        tween(this.chickenNode)
            .delay(0.3)
            .by(0.3, { position: v3(this.laneWidth, 0, 0) })
            .start();
    }

    stopSpawningVehicleNextLane() {
        const landItem = this.getLaneItem(this.currentLaneIndex + 1);
        landItem?.stopSpawningVehicle();
    }

    scrollToLane(offset: number, duration: number) {
        this.scrollView.scrollToOffset(v2(offset - this.laneWidth * (this.offsetLane + 0.5), 0), duration, true);
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

            const laneItem = this.getLaneItem(nextLane);
            if (isFinalLane) {
                await this.chickenCtrl.playStep();
                if (this.interrupted) {
                    this.completeSettle();
                    return;
                }
                this.updateCurrentAndNextLaneItemBackground();
                laneItem?.playLastLane();
                this.moveChickenToPavement();
                this.adjustMusicVolume(0.1);
                await this.chickenCtrl.playStepSuccessAtLastLane();
                this.adjustMusicVolume(1);
            } else {
                this.scheduleOnce(() => laneItem?.showBarrier(), 0.3);
                if (hasVehicle) {
                    this.scheduleOnce(() => laneItem?.playVehicleStopAtBarrier(), 0.4);
                    this.scheduleOnce(() => this.chickenCtrl.chickenScare(), 0.8);
                }
                await this.chickenCtrl.playStep();
                if (!hasVehicle) {
                    this.chickenCtrl.chickenSmile();
                } else {
                    await AnimationUtils.delayTime(0.4);
                }
                this.updateCurrentAndNextLaneItemBackground();
            }
            this.triggerUpdateWinAmount();
            if (this.interrupted) {
                this.completeSettle();
                return;
            }
            this.setUIMiningState();
            this.checkIfSettled();
            this.checkPlaceBetNextRound();

            this.interrupted = false;
        } catch (e) { }
    }

    @handle(BetHandler, (handler) => handler.triggerUpdateWinAmount())
    triggerUpdateWinAmount() { }

    adjustMusicVolume(volumeScale: number) {
        AudioUtils.setMusicVolumeScale(volumeScale);
    }

    getLaneItem(index: number) {
        return this.laneContent.children[index]?.getComponent(LaneItem);
    }

    @handle(BetHandler, (handler) => handler.checkIfSettled())
    checkIfSettled() { }

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

    @handle(BetHandler, (handler) => handler.setUIAnimatingState())
    setUIAnimatingState() { }

    @handle(AutoPlayHandler, (handle) => handle.checkAutoBetNextRound())
    checkPlaceBetNextRound() { }

    updateCurrentLaneItemBackground() {
        this.getLaneItem(this.currentLaneIndex)?.toggleCurrentMultiplierBackground(false);
    }

    updateCurrentAndNextLaneItemBackground() {
        const currentLaneItem = this.getLaneItem(this.currentLaneIndex);
        if (currentLaneItem) {
            currentLaneItem.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.CURRENT_STEP));
            currentLaneItem.toggleCurrentMultiplierBackground();
            currentLaneItem.isClickable = false;
        }

        const nextLandItem = this.getLaneItem(this.currentLaneIndex + 1);
        if (nextLandItem) {
            nextLandItem.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.NEXT_STEP));
            nextLandItem.isClickable = true;
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
                this.chickenCtrl.playStep();
                this.scheduleOnce(() => {
                    const laneItem = this.getLaneItem(this.currentLaneIndex);
                    laneItem?.playCrashVehicle(() => { });
                    this.chickenCtrl.playCrash(this.scrollView.content.parent).then(() => {
                        this.triggerUpdateWinAmount();
                        this.triggerSettleStatus();
                    });
                }, 0.7);
            }
        } catch (e) { }
    }

    @handle(BetHandler, (handler) => handler.triggerSettleStatus())
    triggerSettleStatus() { }

    private reset() {
        this.resetLandItemsBackground();
        this.resetChicken();
        this.scrollView.scrollToLeft(0.2);
    }

    private resetChicken() {
        ComponentUtils.moveToOtherNode(this.chickenNode, this.scrollView.content);
        this.chickenNode.worldPosition = this.startPoint.worldPosition;
        this.chickenCtrl.reset();
    }

    private resetLandItemsBackground() {
        const landItems = this.laneContent.children;
        for (let index = 0; index < landItems.length; index++) {
            const laneItem = this.getLaneItem(index);
            laneItem.toggleCurrentMultiplierBackground(false);
            laneItem.resetLaneItem();
            if (index === 0) {
                laneItem.setMultiplierStyle(Color.WHITE, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.NEXT_STEP));
                laneItem.isClickable = true;
            } else {
                laneItem.setMultiplierStyle(LaneItem.DEFAULT_TEXT_COLOR, CrashUtils.getBgMultiplierColor(BG_MULTIPLIER_COLOR_INDEX.DEFAULT));
                laneItem.startRandomSpawning();
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
