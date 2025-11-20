import gc from "@sg/game-client-base";
import { _decorator, Button, find, instantiate, Node, Prefab, ScrollView, UITransform, Vec3 } from "cc";
import Observer from "observer";

import { NestedScrollManager } from "db://shared-components/shared/common-components/nested-scroll-manager/nested-scroll-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { BetHistoryLog, MyBetModel, MyBetStore } from "../../../handlers/crash-v2/bet/crash-bet-history-store";
import { BetHistoryHandlers, HistoryConstants } from "../../../handlers/crash-v2/handlers/bet-history-handlers";
import BetHistoryTableBodyRow from "./bet-history-table-body-row";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("MyBetTableBody")
export class MyBetTableBody extends ObserverComponent {
    @property({ type: Node })
    content: Node = null;

    @property({ type: Prefab })
    itemPrefab: Prefab = null;

    @property({ type: Node })
    reachMaxWinNode: Node = null;

    private readonly tooltipPositionX: number = 230;
    private readonly tooltipPositionYBuffer: number = 48;
    private startYPosition: number;
    private itemHeight: number;
    private readonly pageSize: number = HistoryConstants.pageSizeMyHistory;

    private currentPageIndex = 1;
    private currentIndex = 0;
    private isFetchingData = false;
    private isNodataToFetch = false;
    private lastScrollTopTime = 0;
    private readonly scrollTopThreshold: number = 1000; // 1 second threshold
    private scrollView: ScrollView = null;

    private getHistoryItemComponent(node: Node): BetHistoryTableBodyRow {
        return node.getComponent(BetHistoryTableBodyRow);
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

        this.setupHoverEvents(bodyItem);
        return bodyItem;
    }

    private setupHoverEvents(bodyItem: Node): void {
        bodyItem.on(HistoryConstants.hoverTriggerParent, this.onHoverMaxReachTrigger, this);
        bodyItem.on(HistoryConstants.exitHoverTriggerParent, this.onExitHoverMaxReachTrigger, this);
    }

    private onHoverMaxReachTrigger(childNode: Node): void {
        const tooltipButton = this.reachMaxWinNode.getComponent(Button);
        const position = childNode.getPosition();
        const positionY = this.content.getPosition().y + position.y - this.tooltipPositionYBuffer;

        tooltipButton.node.setPosition(new Vec3(this.tooltipPositionX, positionY, 0));
        tooltipButton.node.active = true;
    }

    private onExitHoverMaxReachTrigger(): void {
        const tooltipButton = this.reachMaxWinNode.getComponent(Button);
        tooltipButton.node.active = false;
    }

    @handle(BetHistoryHandlers.BetHistoryHandlers, (handler, pageNumber: number) =>
        handler.getHistory(pageNumber, HistoryConstants.pageSizeMyHistory, HistoryConstants.mybet)
    )
    private fetchData(): number {
        return this.currentPageIndex;
    }

    @render(MyBetStore, (store) => store.myBetModel, { fireImmediately: false })
    private showMyBet(myBetModel: MyBetModel): void {
        this.renderData(myBetModel);
    }

    @render(MyBetStore, (store) => store.settleStatus, { fireImmediately: false })
    private showSettleStatus(settleStatus: { win: boolean; bet: number }): void {
        if (this.scrollView?.getScrollOffset().y <= 0) {
            this.fetchDataFirstPage();
        }
    }

    @render(gc.Connection.ConnectionStore, (store) => store.signedIn, { fireImmediately: false })
    private renderSignedIn(signedIn: boolean): void {
        if (signedIn) {
            this.fetchDataFirstPage();
        }
    }

    private renderData(myBetModel: MyBetModel): void {
        myBetModel.betLogs.forEach((betLogItem, rowIndex) => {
            this.processBetHistory(betLogItem, rowIndex);
        });

        this.updateUIAfterRender(myBetModel);
    }

    private processBetLogDetails(betLogItem: any, rowIndex: number): void {
        betLogItem.betLogDetails.forEach((betLogDetail: any) => {
            if (betLogDetail.action.toString() === gc.GameClientEmitMessage.Bet.eventName.toString()) {
                this.createAndPositionBetItem(betLogItem, rowIndex, betLogDetail);
            }
        });
    }

    private processBetHistory(betHistoryLog: BetHistoryLog, rowIndex: number): void {
        const item = this.buildBodyRow(this.itemPrefab, betHistoryLog, rowIndex, Number(betHistoryLog.betWin));
        this.content.addChild(item);
        const currentPosition = item.getPosition();
        const y = this.startYPosition - this.currentIndex * this.itemHeight;

        item.setPosition(currentPosition.x, y);
        this.currentIndex++;
    }

    private createAndPositionBetItem(betLogItem: any, rowIndex: number, betLogDetail: any): void {
        const item = this.buildBodyRow(this.itemPrefab, betLogItem, rowIndex, Number(betLogDetail.betKey));
        this.content.addChild(item);

        const currentPosition = item.getPosition();
        const y = this.startYPosition - this.currentIndex * this.itemHeight;

        item.setPosition(currentPosition.x, y);
        this.currentIndex++;
    }

    private updateUIAfterRender(myBetModel: MyBetModel): void {
        if (myBetModel.betLogs.length < this.pageSize) {
            this.isNodataToFetch = true;
        }

        this.content.getComponent(UITransform).height = this.currentIndex * this.itemHeight;
        this.isFetchingData = false;
    }

    onLoad() {
        this.itemHeight = this.itemPrefab?.data.getComponent(UITransform).height || 0;
        this.startYPosition = -this.itemHeight / 2;
        this.initScrollView();
        this.setupScrollListener();
        super.onLoad();
        this.fetchData();
    }

    private initScrollView() {
        this.scrollView = this.node.getComponent(ScrollView);
        const nestedScrollManager = find("Canvas").getComponentInChildren(NestedScrollManager);
        if (nestedScrollManager) {
            nestedScrollManager.addChildScrollViews([this.scrollView]);
        }
    }

    private setupScrollListener() {
        this.node.on(ScrollView.EventType.SCROLL_TO_BOTTOM, this.onScrolling, this);
        this.node.on(ScrollView.EventType.SCROLL_TO_TOP, this.onScrollingTop, this);
    }

    private onScrolling() {
        if (!this.isNodataToFetch && !this.isFetchingData) {
            this.currentPageIndex++;
            this.isFetchingData = true;
            this.fetchData();
        }
    }

    private onScrollingTop() {
        const currentTime = Date.now();
        if (!this.isFetchingData && currentTime - this.lastScrollTopTime >= this.scrollTopThreshold) {
            this.fetchDataFirstPage();
        }
    }

    private fetchDataFirstPage() {
        const currentTime = Date.now();
        this.currentPageIndex = 1;
        this.currentIndex = 0;
        this.isFetchingData = true;
        this.isNodataToFetch = false;
        this.content.removeAllChildren();
        this.fetchData();
        this.lastScrollTopTime = currentTime;
    }

    onDestroy() {
        if (this.node) {
            this.node.off(ScrollView.EventType.SCROLL_TO_BOTTOM, this.onScrolling, this);
            this.node.off(ScrollView.EventType.SCROLL_TO_TOP, this.onScrollingTop, this);
        }
    }
}
