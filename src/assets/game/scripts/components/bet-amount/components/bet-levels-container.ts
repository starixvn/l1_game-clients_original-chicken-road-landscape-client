import gc from "@sg/game-client-base";
import { _decorator, instantiate, Layout, Node, Prefab, UITransform } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import BetLevelItem from "./bet-level-item";
import { BetAmountStore } from "../bet-amount-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class BetLevelsContainer extends ObserverComponent {
    @property(Node)
    content: Node = null;

    @property(Prefab)
    prfBetLevelItem: Prefab = null;

    private betLevels: number[] = [];

    setBetLevels(betLevels: number[]) {
        if (betLevels.length <= 0) {
            return;
        }
        this.betLevels = betLevels;
        this.initBetLevelItems(betLevels);
        this.calculateContainerWidth();

    }

    initBetLevelItems(betLevels: number[]) {
        betLevels.forEach((value, index) => {
            const node = instantiate(this.prfBetLevelItem);
            this.content.addChild(node);

            const itemComp = node.getComponent(BetLevelItem);
            itemComp.setData(value);
        });
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

    @render(gc.Bet.BetStore, (store) => store.amount)
    renderBetAmount(amount: number) {
        if (this.content.children.length <= 0) {
            return;
        }
        this.content.children.forEach((child) => {
            child.getComponent(BetLevelItem).setSelectedNode(false);
        });
        const index = this.betLevels.findIndex((betLevel) => betLevel === amount);
        if (index >= 0) {
            const selectedNode = this.content.children[index];
            const comp = selectedNode.getComponent(BetLevelItem);
            comp.setSelectedNode(true);
        }
    }

    @render(BetAmountStore, (store) => store.disabledBetAmount)
    renderDisabledBetAmount(disabledBetAmount: boolean) {
        this.content.children.forEach((child) => {
            child.getComponent(BetLevelItem).setDisabledNode(disabledBetAmount);
        });
    }
}
