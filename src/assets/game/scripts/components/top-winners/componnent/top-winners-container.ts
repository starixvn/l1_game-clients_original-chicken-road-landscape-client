import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, Tween, tween, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { TopWinner, TopWinnersStore } from "../top-winners-store";
import { TopWinnerItem } from "./top-winner-item";
const { ccclass, property } = _decorator;

const { Player } = gc;
const { render } = Observer;
const { MainPlayerStore } = Player;

const MAX_ITEMS = 10;
@ccclass
export class TopWinnersContainer extends ObserverComponent {
    @property(Node)
    container: Node = null;

    @property(Prefab)
    topWinnerPrefab: Prefab = null;

    @property
    itemSize = 72;

    @property
    padding = 5;

    playerName = "";

    items: Node[] = [];

    private winners: TopWinner[] = [];

    @render(gc.Player.MainPlayerStore, (store) => store.name)
    renderPlayerName(name: string) {
        this.playerName = name;

        if (this.items?.length) {
            this.items.forEach((node) => {
                const item = node.getComponent(TopWinnerItem);
                if (!item || !item.winnerData) {
                    return;
                }

                item.setHighlight(this.isMainPlayer(item.winnerData.name));
            });
        }
    }

    private isMainPlayer(name: string) {
        return name === this.playerName;
    }

    @render(TopWinnersStore, (store) => store.winners)
    renderWinners(winners: TopWinner[]) {
        this.container.removeAllChildren();
        this.items = [];
        winners.forEach((winner) => this.addItem(winner, false));
        this.winners = [...winners];
        this.layoutItems();
    }

    @render(TopWinnersStore, (store) => store.newTopWinner)
    renderNewTopWinner(newTopWinner: TopWinner) {
        if (!newTopWinner) {
            return;
        }

        const existingWinner = this.winners.find((w) => w.roundId === newTopWinner.roundId);
        if (!existingWinner) {
            this.winners.shift();
            this.winners.push(newTopWinner);
            const newList = [newTopWinner];

            newList.forEach((winner) => this.addItem(winner, false));

            newList.forEach((_, index) => {
                const node = this.items[index];
                AnimationUtils.setOpacityNode(node, 0);
                AnimationUtils.fadeIn(node, 0.3);
            });

            this.pushDownOldItems(newList.length);
        } else {
            if (this.items?.length) {
                this.items.forEach((node) => {
                    const item = node.getComponent(TopWinnerItem);
                    if (!item || item.winnerData?.roundId !== newTopWinner.roundId) {
                        return;
                    }
                    item.setData(newTopWinner, this.isMainPlayer(item.winnerData.name));
                });
            }
        }
    }

    private addItem(winner: TopWinner, isNew: boolean) {
        const winnerNode = instantiate(this.topWinnerPrefab);
        const topWinnerItem = winnerNode.getComponent(TopWinnerItem);
        const isMainPlayer = this.isMainPlayer(winner.name);

        topWinnerItem.setData(winner, isMainPlayer);

        this.container.insertChild(winnerNode, 0);
        this.items.unshift(winnerNode);

        winnerNode.setPosition(0, 0, 0);

        if (isNew) {
            AnimationUtils.setOpacityNode(winnerNode, 0);
            AnimationUtils.fadeIn(winnerNode, 0.3);
        }
    }

    private pushDownOldItems(newCount = 1) {
        if (this.items.length <= MAX_ITEMS) {
            this.layoutItemsWithAnimation(newCount);
            return;
        }

        const removed = this.items.splice(MAX_ITEMS);
        removed.forEach((node) => {
            AnimationUtils.fadeOut(node, 0.3).then(() => node.destroy());
        });

        this.layoutItemsWithAnimation(newCount);
    }

    private layoutItems() {
        this.items.forEach((item, index) => {
            const y = -(this.itemSize + this.padding) * index;
            item.setPosition(0, y, 0);
        });
    }

    private layoutItemsWithAnimation(newCount = 1) {
        this.items.forEach((item, index) => {
            const targetY = -(this.itemSize + this.padding) * index;

            if (index < newCount) {
                item.setPosition(0, targetY, 0);
                return;
            }

            Tween.stopAllByTarget(item);
            tween(item)
                .to(0.3, { position: v3(0, targetY, 0) })
                .start();
        });
    }
}
