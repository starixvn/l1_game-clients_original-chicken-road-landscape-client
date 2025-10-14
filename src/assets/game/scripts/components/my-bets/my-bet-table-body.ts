import { _decorator, instantiate, Node, Prefab, UITransform } from 'cc';
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetHistoryLog, MyBetModel, MyBetStore } from "../../handlers/crash-v2/bet/crash-bet-history-store";
import MyBetBodyRow from "./my-bet-body-row";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass('MyBetTableBody')
export class MyBetTableBody extends ObserverComponent {
    @property({ type: Node })
    content: Node = null;

    @property({ type: Prefab })
    itemPrefab: Prefab = null;

    private readonly TOOLTIP_POSITION_X = 318;
    private readonly TOOLTIP_POSITION_Y_BUFFER = 48;

    private readonly startYPosition = 0;
    private readonly itemHeight = 0;
    private currentIndex = 0;
    private isFetchingData = false;
    private isNodataToFetch = false;
    private readonly pageSize = 0;

    private getHistoryItemComponent(node: Node): MyBetBodyRow {
        return node.getComponent(MyBetBodyRow);
    }

    private buildBodyRow(
        bodyItemPrefab: Prefab,
        betHistoryLog: BetHistoryLog,
        index: number,
        betKey: number,
        fractionalOddsFormat = false
    ): Node {
        const bodyItem = instantiate(bodyItemPrefab);
        const component = this.getHistoryItemComponent(bodyItem);

        component?.setData({
            betHistoryLog,
            index,
            betKey,
            fractionalOddsFormat,
        });
        return bodyItem;
    }

    private processBetHistory(betHistoryLog: BetHistoryLog, rowIndex: number): void {
        const item = this.buildBodyRow(this.itemPrefab, betHistoryLog, rowIndex, Number(betHistoryLog.betWin));
        this.content.addChild(item);
        const currentPosition = item.getPosition();
        const y = this.startYPosition - this.currentIndex * this.itemHeight;

        item.setPosition(currentPosition.x, y);
        this.currentIndex++;
    }

    @render(MyBetStore, (store) => store.myBetModel, { fireImmediately: false })
    private showMyBet(myBetModel: MyBetModel): void {
        console.log('showMyBet', myBetModel);
    }

    private renderData(myBetModel: MyBetModel): void {
        myBetModel.betLogs.forEach((betLogItem, rowIndex) => {
           this.processBetHistory(betLogItem, rowIndex);
        });

        this.updateUIAfterRender(myBetModel);
    }

    private updateUIAfterRender(myBetModel: MyBetModel): void {
        if (myBetModel.betLogs.length < this.pageSize) {
            this.isNodataToFetch = true;
        }

        this.content.getComponent(UITransform).height = this.currentIndex * this.itemHeight;
        this.isFetchingData = false;
    }


    onLoad() {
        super.onLoad();
    }

}


