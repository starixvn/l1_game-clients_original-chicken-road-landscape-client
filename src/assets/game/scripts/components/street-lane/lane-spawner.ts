import { _decorator, instantiate, Node, Prefab, ScrollView, SpriteFrame, tween, UITransform, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
import { settings } from "../../game-settings";
import { BetHandler } from "../bets/bet-handler";
import { BetStore, BetUIState } from "../bets/bet-store";
import { ChickenController } from "../chicken/chicken";
import { AutoPlayHandler } from "../play-mode/auto-play/auto-play-handler";
import { AutoPlayStore } from "../play-mode/auto-play/auto-play-store";
import { CrashVehicleController } from "../random-vehicle/crash-vehicle";
import { RandomVehicleController } from "../random-vehicle/random-vehicle";
import LaneItem from "./lane-item";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("LaneSpawner")
export class LaneSpawner extends ObserverComponent {
    @property(Prefab)
    lanePrefab: Prefab = null;

    @property(Node)
    laneContent: Node = null;

    @property(Node)
    streetFullView: Node = null;

    @property(Node)
    chickenNode: Node = null;

    @property(Node)
    crashVehicleNode: Node = null;

    @property(Node)
    randomVehicleNode: Node = null;

    @property(Prefab)
    chickenPrefab: Prefab = null;

    @property(Node)
    startPoint: Node = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    centerNode: Node = null;

    private chickenCtrl: ChickenController = null;
    private crashVehicleCtrl: CrashVehicleController = null;
    private randomVehicleCtrl: RandomVehicleController = null;
    private laneWidth = 0;
    private currentLaneIndex = -1;
    private currentConfig: FixedStepsMultiplierConfig;

    private isAutoPlay = false;

    onLoad() {
        super.onLoad();
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        this.currentConfig = currentMultiplierConfig;
        if (this.currentConfig) {
            this.renderLane();
        }
    }

    @render(AutoPlayStore, (store) => store.isAutoplay)
    setIsAutoPlay(isAutoPlay: boolean) {
        this.isAutoPlay = isAutoPlay;
    }

    renderLane() {
        this.spawnLanes();
        this.updateStreetFullViewWidth();

        if (this.chickenNode) {
            this.chickenCtrl = this.chickenNode.getComponent(ChickenController);
            this.spawnChickenAtStart();
        }
        if (this.crashVehicleNode) {
            this.crashVehicleCtrl = this.crashVehicleNode.getComponent(CrashVehicleController);
        }

        if (this.randomVehicleNode) {
            this.randomVehicleCtrl = this.randomVehicleNode.getComponent(RandomVehicleController);
        }
    }

    spawnLanes() {
        if (!this.lanePrefab || !this.laneContent || !this.currentConfig) {
            return;
        }
        this.laneContent.children.length > 0 && this.laneContent.removeAllChildren();
        this.laneWidth = this.lanePrefab.data.getComponent(UITransform).width;

        for (let index = 0; index < this.currentConfig.multiplierSteps.length; index++) {
            const multiplier = this.currentConfig.multiplierSteps[index];
            const lane = instantiate(this.lanePrefab);
            this.laneContent.addChild(lane);

            const landItem = lane.getComponent(LaneItem);
            if (landItem) {
                landItem.setMultiplier(multiplier);
                if (index === 0) {
                    landItem.multiplierBg.spriteFrame = landItem.nextStepMultiplierBgFrame;
                }
            }
        }
    }

    updateStreetFullViewWidth() {
        if (this.streetFullView && this.laneContent && this.currentConfig) {
            const laneContentWidth = this.lanePrefab.data.getComponent(UITransform).width * (this.currentConfig.multiplierSteps.length + 1);
            const newWidth = laneContentWidth + 162;
            this.streetFullView.getComponent(UITransform).width = newWidth;
        }
    }

    spawnChickenAtStart() {
        if (this.startPoint) {
            const localPos = this.getStartPosition();

            this.chickenNode.setPosition(v3(localPos.x, localPos.y, 0));
        } else {
            const firstLane = this.laneContent.children[0];
            if (firstLane) {
                const laneWorld = firstLane.worldPosition;
                const parent = this.chickenNode.parent;
                const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);
                this.chickenNode.setPosition(v3(localPos.x, localPos.y, 0));
            }
        }

        this.chickenCtrl?.playIdle();
        this.currentLaneIndex = -1;
    }

    async moveChicken(isLastLane = false) {
        const nextLaneIndex = this.currentLaneIndex + 1;
        if (!this.laneContent.children[nextLaneIndex]) {
            return;
        }

        this.currentLaneIndex = nextLaneIndex;
        const lane = this.laneContent.children[nextLaneIndex];

        const laneWorld = lane.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);

        tween(this.chickenNode)
            .delay(0.3)
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .start();

        this.scrollToLane(nextLaneIndex);

        if (isLastLane) {
            return;
        }

        // Wait for randomVehicleCtrl to finish current spawn before updating position
        await this.waitForVehicleAndUpdatePosition();
    }

    async waitForVehicleAndUpdatePosition() {
        if (this.randomVehicleCtrl.isPLayingAnimation) {
            const remainingTime = this.randomVehicleCtrl.getRemainingTime();
            await AnimationUtils.delayTime(remainingTime);
            this.randomVehicleCtrl.stopSpawnVehicle();
        }
        this.updateRandomVehiclePosition();
        this.randomVehicleCtrl.startRandomSpawning();
    }

    updateRandomVehiclePosition() {
        if (!this.randomVehicleCtrl) {
            return;
        }

        const nextVehicleLaneIndex = this.currentLaneIndex + 2;
        if (nextVehicleLaneIndex >= this.laneContent.children.length) {
            return;
        }

        const vehicleLane = this.laneContent.children[nextVehicleLaneIndex];
        if (!vehicleLane) {
            return;
        }

        const vehicleLaneWorld = vehicleLane.worldPosition;
        const parent = this.randomVehicleNode.parent;
        const vehicleLocalPos = parent.getComponent(UITransform).convertToNodeSpaceAR(vehicleLaneWorld);

        this.randomVehicleCtrl.setVehicleLandPosition(v3(vehicleLocalPos.x, this.randomVehicleNode.position.y, 0));
    }

    moveChickenAndVehicle() {
        const nextLaneIndex = this.currentLaneIndex + 1;
        if (!this.laneContent.children[nextLaneIndex]) {
            return;
        }

        this.currentLaneIndex = nextLaneIndex;
        const lane = this.laneContent.children[nextLaneIndex];

        const laneWorld = lane.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);
        this.crashVehicleCtrl.setVehicleLandPosition(v3(localPos.x, this.crashVehicleNode.position.y, 0));

        tween(this.chickenNode)
            .delay(0.3)
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .start();

        this.scrollToLane(nextLaneIndex);
    }

    scrollToLane(laneIndex: number) {
        if (!this.scrollView) {
            return;
        }

        const lane = this.laneContent.children[laneIndex];
        if (!lane) {
            return;
        }

        const content = this.laneContent.getComponent(UITransform);
        const scroll = this.scrollView;
        const viewWidth = scroll.node.getComponent(UITransform).width;

        const lanePos = lane.position.x;
        const halfView = viewWidth / 2;
        let targetX = lanePos - halfView + this.laneWidth / 2;

        const maxOffset = Math.max(content.width - viewWidth, 0);
        targetX = Math.min(Math.max(targetX, 0), maxOffset);

        const ratio = maxOffset > 0 ? targetX / maxOffset : 0;

        this.scrollView.scrollToPercentHorizontal(ratio, 1, true);
    }

    @render(BetStore, (store) => store.multiplier)
    async updateMultiplier(multiplier) {
        if (!this.chickenCtrl) {
            return;
        }
        try {
            const minMultiplier = this.currentConfig.multiplierSteps[0];

            if (multiplier >= minMultiplier) {
                const nextLane = this.currentLaneIndex + 1;
                const isStepNext = nextLane < this.currentConfig.multiplierSteps.length - 1;
                this.updateCurrentLaneItemBackground();

                if (isStepNext) {
                    let vehicleSpriteFrame: SpriteFrame;
                    const hasVehicle = Math.random() < 0.5;
                    if (hasVehicle) {
                        vehicleSpriteFrame = this.chickenCtrl.randomVehicle();
                    }
                    this.moveChicken();
                    AnimationUtils.delayTime(settings.durations.stepAnimation).then(() => {
                        this.updateCurrentAndNextLaneItemBackground();
                    });
                    this.chickenCtrl.playStepSuccess(hasVehicle).then(() => {
                        this.setUIMiningState();
                        if (this.isAutoPlay) {
                            this.checkPlaceBetNextRound();
                        }
                        this.showBarrier(nextLane, vehicleSpriteFrame);
                    });
                } else {
                    this.moveChicken(true);
                    AnimationUtils.delayTime(settings.durations.stepAnimation).then(() => {
                        this.updateCurrentAndNextLaneItemBackground();
                    });
                    this.chickenCtrl.playStepSuccessAtLastLane();
                }
            } else {
                this.updateCurrentLaneItemBackground();
            }
        } catch (e) {}
    }

    @handle(BetHandler, (handler) => handler.setUIMiningState())
    setUIMiningState() {}

    @handle(AutoPlayHandler, (handle) => handle.checkAutoBetNextRound())
    checkPlaceBetNextRound() {}

    async showBarrier(landIndex: number, vehicleSpriteFrame: SpriteFrame) {
        try {
            const landItem = this.laneContent.children[landIndex];
            if (landItem) {
                const landItemComponent = landItem.getComponent(LaneItem);
                if (landItemComponent) {
                    landItemComponent.barrierNode.active = true;
                    if (vehicleSpriteFrame) {
                        landItemComponent.showVehicle(vehicleSpriteFrame);
                    }
                }
            }
        } catch (error) {}
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
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.currentStepMultiplierBgFrame;
                landItemComponent.toggleCurrentMultiplierBackground();
            }
        }

        const nextLandItem = this.laneContent.children[this.currentLaneIndex + 1];
        if (nextLandItem) {
            const landItemComponent = nextLandItem.getComponent(LaneItem);
            if (landItemComponent) {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.nextStepMultiplierBgFrame;
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
                this.moveChickenAndVehicle();
                this.crashVehicleCtrl.playVehicle();
                await this.chickenCtrl.playCrashAtCenter();
            }
        } catch (e) {}
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
        this.chickenCtrl.playIdle();
        this.chickenCtrl.hideBarrier();
    }

    private resetLandItemsBackground() {
        const landItems = this.laneContent.children;
        for (let index = 0; index < landItems.length; index++) {
            const landItem = landItems[index];
            const landItemComponent = landItem.getComponent(LaneItem);
            landItemComponent.barrierNode.active = false;
            landItemComponent.toggleCurrentMultiplierBackground(false);
            landItemComponent.vehicleNode.active = false;
            if (index === 0) {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.nextStepMultiplierBgFrame;
            } else {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.defaultMultiplierBgFrame;
            }
        }
    }
}
