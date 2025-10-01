import { _decorator, Component, Node, Prefab, instantiate, Label, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LaneSpawner')
export class LaneSpawner extends Component {
    @property(Prefab)
    lanePrefab: Prefab = null;

    @property(Node)
    laneContent: Node = null;

    @property
    totalLanes: number = 30;

    @property(Node)
    streetFullView: Node = null;

    start() {
        this.spawnLanes();
        this.updateStreetFullViewWidth();
    }

    spawnLanes() {
        if (!this.lanePrefab || !this.laneContent) {
            console.warn("Missing lanePrefab or content");
            return;
        }

        for (let i = 0; i < this.totalLanes; i++) {
            const lane = instantiate(this.lanePrefab);
            this.laneContent.addChild(lane);

            const multiplierLabel = lane.getChildByName("Multiplier")?.getComponent(Label);
            if (multiplierLabel) {
                multiplierLabel.string = `${(1 + Math.random() * 2).toFixed(1)}x`;
            }
        }
    }

    updateStreetFullViewWidth() {
        if (this.streetFullView && this.laneContent) {
            const laneContentWidth = this.lanePrefab.data.getComponent(UITransform).width * this.totalLanes;
            const newWidth = laneContentWidth + 162;
            this.streetFullView.getComponent(UITransform).width = newWidth;
            console.log('updateStreetFullViewWidth', newWidth);
        }
    }

    onLoad() {
        this.updateStreetFullViewWidth();
    }

    onLaneContentWidthChanged() {
        this.updateStreetFullViewWidth();
    }
}
