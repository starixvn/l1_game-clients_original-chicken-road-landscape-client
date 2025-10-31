import { _decorator, instantiate, Node, Prefab, ScrollView, tween, UITransform, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
import { BetHandler } from "../bets/bet-handler";
import { BetStore, BetUIState } from "../bets/bet-store";
import { ChickenController } from "../chicken/chicken";
import { CrashVehicleController } from "../random-vehicle/crash-vehicle";
import { RandomVehicleController } from "../random-vehicle/random-vehicle";
import LandItem from "./land-item";

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
    nextStepRandomVehicleNode: Node = null;

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
    private nextStepRandomVehicleCtrl: RandomVehicleController = null;
    private randomVehicleCtrl: RandomVehicleController = null;
    private laneWidth = 0;
    private currentLaneIndex = -1;
    private currentConfig: FixedStepsMultiplierConfig;

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
        if (this.nextStepRandomVehicleNode) {
            this.nextStepRandomVehicleCtrl = this.nextStepRandomVehicleNode.getComponent(RandomVehicleController);
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
            const step = this.currentConfig.multiplierSteps[index];
            const lane = instantiate(this.lanePrefab);
            this.laneContent.addChild(lane);

            const landItem = lane.getComponent(LandItem);
            if (landItem) {
                landItem.lblMultiplier.string = `${step.toFixed(2)}x`;
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

        tween(this.chickenNode)
            .delay(0.3)
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .start();

        this.scrollToLane(nextLaneIndex);

        this.updateRandomVehiclePosition(true);
        this.nextStepRandomVehicleCtrl.startRandomSpawning();
        this.updateRandomVehiclePosition();
        this.randomVehicleCtrl.startRandomSpawning();
    }

    updateRandomVehiclePosition(isNextStep = false) {
        if (!this.nextStepRandomVehicleCtrl || !this.randomVehicleCtrl) {
            return;
        }

        const nextVehicleLaneIndex = isNextStep ? this.currentLaneIndex + 1 : this.currentLaneIndex + 2;
        if (nextVehicleLaneIndex >= this.laneContent.children.length) {
            return;
        }

        const vehicleLane = this.laneContent.children[nextVehicleLaneIndex];
        if (!vehicleLane) {
            return;
        }

        const vehicleLaneWorld = vehicleLane.worldPosition;
        const parent = isNextStep ? this.nextStepRandomVehicleNode.parent : this.randomVehicleNode.parent;
        const vehicleLocalPos = parent.getComponent(UITransform).convertToNodeSpaceAR(vehicleLaneWorld);
        if (isNextStep) {
            this.nextStepRandomVehicleCtrl.setVehicleLandPosition(v3(vehicleLocalPos.x, this.nextStepRandomVehicleNode.position.y, 0));
        } else {
            this.randomVehicleCtrl.setVehicleLandPosition(v3(vehicleLocalPos.x, this.randomVehicleNode.position.y, 0));
        }
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

        const minMultiplier = this.currentConfig.multiplierSteps[0];
        if (multiplier >= minMultiplier) {
            const nextLane = this.currentLaneIndex + 1;
            const isStepNext = nextLane < this.currentConfig.multiplierSteps.length - 1;
            if (this.nextStepRandomVehicleCtrl.isPLayingAnimation) {
                await AnimationUtils.delayTime(2);
                this.nextStepRandomVehicleCtrl.stopSpawnVehicle();
            }
            if (isStepNext) {
                this.moveChicken();
                this.chickenCtrl.playStepSuccess();
                this.showBarrier(nextLane);
            } else {
                this.moveChicken();
                await this.chickenCtrl.playStepSuccessAtLastLane();

                this.reset();
            }
            try {
                await AnimationUtils.delayTime(1);
                this.updateLandItemBackground();
            } catch (e) {}
        }
    }

    async showBarrier(landIndex: number) {
        try {
            await AnimationUtils.delayTime(2);
            const landItem = this.laneContent.children[landIndex];
            if (landItem) {
                const landItemComponent = landItem.getComponent(LandItem);
                if (landItemComponent) {
                    landItemComponent.barrierNode.active = true;
                }
            }
        } catch (error) {}
    }

    updateLandItemBackground() {
        const currentLandItem = this.laneContent.children[this.currentLaneIndex];

        if (currentLandItem) {
            const landItemComponent = currentLandItem.getComponent(LandItem);
            if (landItemComponent) {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.currentStepMultiplierBgFrame;
            }
        }

        const nextLandItem = this.laneContent.children[this.currentLaneIndex + 1];
        if (nextLandItem) {
            const landItemComponent = nextLandItem.getComponent(LandItem);
            if (landItemComponent) {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.nextStepMultiplierBgFrame;
            }
        }
    }

    @render(BetStore, (store) => store.uiState)
    updateUIState(uiState: BetUIState) {
        if (uiState === BetUIState.Start) {
            this.currentLaneIndex = -1;
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
            if (this.chickenCtrl.isPlayAnimation) {
                return;
            }
            this.reset();
        } catch (e) {}
    }

    private reset() {
        this.resetLandItemsBackground();
        this.resetChicken();
        this.scrollView.scrollToLeft(0.2);
        this.completeSettle();
        this.nextStepRandomVehicleCtrl.stopSpawnVehicle();
    }

    @handle(BetHandler, (handler) => handler.completeSettle())
    completeSettle() {}

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
            const landItemComponent = landItem.getComponent(LandItem);
            landItemComponent.barrierNode.active = false;
            if (index === 0) {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.nextStepMultiplierBgFrame;
            } else {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.defaultMultiplierBgFrame;
            }
        }
    }
}
