import { _decorator, instantiate, Node, Prefab, ScrollView, tween, UITransform, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
import { BetHandler } from "../bets/bet-handler";
import { BetStore, BetUIState } from "../bets/bet-store";
import { ChickenController } from "../chicken/chicken";
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

    @property(Prefab)
    chickenPrefab: Prefab = null;

    @property(Node)
    startPoint: Node = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    centerNode: Node = null;

    private chickenCtrl: ChickenController = null;
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
            const localPos = this.getStartPos();

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
    }

    moveChickenWhenCrash() {
        const nextLane = this.currentLaneIndex + 1;
        if (!this.laneContent.children[nextLane]) {
            return;
        }

        this.currentLaneIndex = nextLane;
        const lane = this.laneContent.children[nextLane];

        const laneWorld = lane.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);

        tween(this.chickenNode)
            .delay(0.3)
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .start();

        this.scrollToLane(nextLane);
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

        this.scrollView.scrollToPercentHorizontal(ratio, 0.3, true);
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
            if (isStepNext) {
                this.moveChicken();
                this.chickenCtrl.playStepSuccess();
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
                this.moveChicken();

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
    }

    @handle(BetHandler, (handler) => handler.completeSettle())
    completeSettle() {}

    private getStartPos() {
        const startWorld = this.startPoint.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(startWorld);
        return localPos;
    }

    private resetChicken() {
        const startPos = this.getStartPos();
        this.chickenNode.setPosition(startPos);
        this.chickenCtrl.playIdle();
        this.chickenCtrl.hideBarrier();
    }

    private resetLandItemsBackground() {
        const landItems = this.laneContent.children;
        for (let index = 0; index < landItems.length; index++) {
            const landItem = landItems[index];
            const landItemComponent = landItem.getComponent(LandItem);
            if (index === 0) {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.nextStepMultiplierBgFrame;
            } else {
                landItemComponent.multiplierBg.spriteFrame = landItemComponent.defaultMultiplierBgFrame;
            }
        }
    }
}
