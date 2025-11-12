import { _decorator, instantiate, Layout, Node, Prefab, UITransform } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetAmountStore } from "../bet-amount-store";
import BetLevelItem from "./bet-level-item";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class BetLevelsContainer extends ObserverComponent {
    @property(Node)
    content: Node = null;

    @property(Prefab)
    prfBetLevelItem: Prefab = null;


    @render(BetAmountStore, (store) => store.betLevels)
    assignBetLevel(betLevels: number[]) {
        if (!betLevels || betLevels.length === 0) {
            return;
        }
        this.setBetLevels(betLevels);
    }

    setBetLevels(betLevels: number[]) {
        if (betLevels.length <= 0) {
            return;
        }
        this.initBetLevelItems(betLevels);
        this.calculateContainerWidth();
    }

    initBetLevelItems(betLevels: number[]) {
        this.content.destroyAllChildren();
        for (let index = 0; index <= betLevels.length; index++) {
            const isMax = index >= betLevels.length;
            const value = isMax ? "max" : betLevels[index];
            const node = instantiate(this.prfBetLevelItem);
            this.content.addChild(node);

            const itemComp = node.getComponent(BetLevelItem);
            itemComp.setData(value, isMax);
        };
    }

    private calculateContainerWidth() {
        const layout = this.content.getComponent(Layout);
        layout.updateLayout();

        const itemCount = this.content.children.length;
        const columnCount = Math.min(itemCount, layout.constraintNum);
        const itemWidth = this.content.children.length > 0 ? this.content.children[0].getComponent(UITransform).width : 0;
        const width = columnCount * itemWidth + (columnCount - 1) * layout.spacingX + layout.paddingLeft + layout.paddingRight;
        this.content.getComponent(UITransform).width = width;
    }
}
