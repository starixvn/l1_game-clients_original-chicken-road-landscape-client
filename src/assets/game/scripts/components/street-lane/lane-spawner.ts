import { _decorator, Component, Node, Prefab, instantiate, Label, UITransform, v3, tween, ScrollView } from 'cc';
import { ChickenController } from '../chicken/chicken';
import Observer from "observer";
import { BetStore, BetUIState } from '../bets/bet-store';
import { ObserverComponent } from 'db://shared-components/shared/common-components/observer-component/scripts/observer-component';

const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass('LaneSpawner')
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

    private chickenCtrl: ChickenController = null;
    private laneWidth = 0;
    private chicken: Node = null;
    private currentLaneIndex = 0;
    private currentLane = -1;

    start() {
        this.spawnLanes();
        this.updateStreetFullViewWidth();

        if (this.chickenNode) {
            this.chickenCtrl = this.chickenNode.getComponent(ChickenController);
            this.spawnChickenAtStart();
        }
    }

    onLoad() {
        super.onLoad();
    }

    spawnLanes() {
        if (!this.lanePrefab || !this.laneContent) return;

        this.laneWidth = this.lanePrefab.data.getComponent(UITransform).width;

        for (let i = 0; i < this.totalLanes; i++) {
            const lane = instantiate(this.lanePrefab);
            this.laneContent.addChild(lane);

            const multiplierLabel = lane.getChildByName("Multiplier")?.getComponent(Label);
            if (multiplierLabel) {
                multiplierLabel.string = `${(1 + Math.random() * 2).toFixed(2)}x`;
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
            // world -> local (Canvas)
            const startWorld = this.startPoint.worldPosition;
            const parent = this.chickenNode.parent;
            const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(startWorld);

            this.chickenNode.setPosition(v3(localPos.x, localPos.y, 0));
        } else {
            // fallback: nếu ko có startPoint thì để ngay lane 0
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

    /** Nhảy sang lane tiếp theo (chỉ đổi X, giữ nguyên Y) */
    moveChicken() {
        const nextLane = this.currentLane + 1;
        if (!this.laneContent.children[nextLane]) return; // hết lane

        this.currentLane = nextLane;
        const lane = this.laneContent.children[nextLane];

        const laneWorld = lane.worldPosition;
        const parent = this.chickenNode.parent;
        const localPos = parent.getComponent(UITransform).convertToNodeSpaceAR(laneWorld);

        this.chickenCtrl.playStep();
        tween(this.chickenNode)
            .to(0.3, { position: v3(localPos.x, this.chickenNode.position.y, 0) })
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


    /** Mỗi lần multiplier thay đổi → gà nhảy next lane */
    @render(BetStore, (store) => store.multiplier)
    updateMultiplier(multiplier) {
        console.log("updateMultiplier", multiplier);
        if (this.chickenCtrl && multiplier > 1) {
            this.moveChicken();
        }
    }

    @render(BetStore, (store) => store.uiState)
    updateUIState(uiState: BetUIState) {
        console.log("updateUIState", uiState);
        if (uiState === BetUIState.Start) {
            this.currentLane = -1;
        }
    }
}
