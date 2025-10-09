import { _decorator, instantiate, Node, Prefab, ScrollView, tween, UITransform, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
import { BetStore, BetUIState } from "../bets/bet-store";
import { ChickenController } from "../chicken/chicken";
import LandItem from "./land-item";

const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass("LaneSpawner")
export class LaneSpawner extends ObserverComponent {
    @property(Prefab)
    lanePrefab: Prefab = null;

    @property(Node)
    laneContent: Node = null;

    @property
    totalLanes: number = 30;

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
    private chicken: Node = null;
    private currentLane = -1;
    private fixedStepsMultiplierConfig: FixedStepsMultiplierConfig[];
    private currentConfig: FixedStepsMultiplierConfig;

    onLoad() {
        super.onLoad();
    }

    @render(InstantWinConfigStore, (store) => store.fixedStepsMultiplierConfigs, { fireImmediately: false })
    setGameConfigs(fixedStepsMultiplierConfig: FixedStepsMultiplierConfig[]) {
        this.fixedStepsMultiplierConfig = fixedStepsMultiplierConfig;
        if (this.fixedStepsMultiplierConfig.length > 0) {
            this.currentConfig = this.fixedStepsMultiplierConfig[0];
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
        if (!this.lanePrefab || !this.laneContent || !this.currentConfig) return;

        this.laneWidth = this.lanePrefab.data.getComponent(UITransform).width;

        for (let i = 0; i < this.currentConfig.values.length; i++) {
            const lane = instantiate(this.lanePrefab);
            this.laneContent.addChild(lane);

            const multiplierLabel = lane.getComponent(LandItem).lblMultiplier;
            if (multiplierLabel) {
                multiplierLabel.string = `${this.currentConfig.values[i]}x`;
            }
        }
    }

    updateStreetFullViewWidth() {
        if (this.streetFullView && this.laneContent) {
            const laneContentWidth = this.lanePrefab.data.getComponent(UITransform).width * this.totalLanes;
            const newWidth = laneContentWidth + 162;
            this.streetFullView.getComponent(UITransform).width = newWidth;
        }
    }

    spawnChickenAtStart() {
        if (this.startPoint) {
            const startWorld = this.startPoint.worldPosition;
            const parent = this.chickenNode.parent;
            const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(startWorld);

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
        this.currentLane = -1;
    }

    moveChicken() {
        const nextLane = this.currentLane + 1;
        if (!this.laneContent.children[nextLane]) return;

        this.currentLane = nextLane;
        const lane = this.laneContent.children[nextLane];

        const laneWorld = lane.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);

        this.chickenCtrl.playStepSuccess();
        tween(this.chickenNode)
            .to(0.5, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
            .call(() => this.chickenCtrl.playIdle())
            .start();

        this.scrollToLane(nextLane);
    }

    scrollToLane(laneIndex: number) {
        if (!this.scrollView) return;

        const lane = this.laneContent.children[laneIndex];
        if (!lane) return;

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
    updateMultiplier(multiplier) {
        if (!this.chickenCtrl) return;

        if (multiplier > 1) {
            const nextLane = this.currentLane + 1;
            if (nextLane < this.totalLanes) {
                this.moveChicken();
            }
        }
    }

    @render(BetStore, (store) => store.uiState)
    updateUIState(uiState: BetUIState) {
        if (uiState === BetUIState.Start) {
            this.currentLane = -1;

            if (this.startPoint && this.chickenNode) {
                const startWorld = this.startPoint.worldPosition;
                const parent = this.chickenNode.parent;
                const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(startWorld);
                this.chickenNode.setPosition(localPos);
            }

            this.chickenCtrl?.playIdle();

            if (this.scrollView) {
                this.scrollView.scrollToLeft(0.2);
            }
        }
    }

    @render(BetStore, (store) => store.settleStatus, { fireImmediately: false })
    handleCrash(settleStatus: any) {
        if (!settleStatus || !this.chickenCtrl) return;

        if (!settleStatus.win) {
            this.chickenCtrl.playCrashAtCenter(this.centerNode);
        }
    }
}
