import gc from "@sg/game-client-base";
import inversify from "inversify";


import { IMultipleHandlers } from "@sg/game-client-base/dist/shared";
import { BetHistoryModel, BetHistoryStore, MyBetModel, MyBetStore } from "../bet/crash-bet-history-store";

const { injectable, inject } = inversify;

export class HistoryConstants {
    static readonly mybet = "mybet";
    static readonly history = "history";
    static readonly settleStatus = "status";
    static readonly pageSizeHistory = 20;
    static readonly pageSizeMyHistory = 12;
    static readonly hoverTriggerParent = "hover-trigger-parent";
    static readonly exitHoverTriggerParent = "exit-hover-trigger-parent";
}

export namespace BetHistoryHandlers {
    @injectable()
    export class BetHistoryHandlers implements IMultipleHandlers {
        @inject(MyBetStore) protected readonly myBetStore: MyBetStore;
        @inject(BetHistoryStore) protected readonly betHistoryStore: BetHistoryStore;
        @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;

        eventHandleList = [
            {
                name: HistoryConstants.mybet,
                handle: this.handleMyBet,
            },
            {
                name: HistoryConstants.history,
                handle: this.handleBetHistory,
            },
            {
                name: HistoryConstants.settleStatus,
                handle: this.handleSettleStatus,
            },
        ];

        handleMyBet(data: MyBetModel) {
            this.myBetStore.setData(data);
        }

        handleBetHistory(data: BetHistoryModel) {
            this.betHistoryStore.setData(data);
        }

        handleSettleStatus(data: { win: boolean; bet: number }) {
            this.myBetStore.setSettleStatus(data);
        }

        getHistory(page: number, pageSize: number, responseKey: string) {
            this.connectionStore.send(gc.GameClientEmitMessage.BetHistory.eventName, { page, pageSize, responseKey });
        }
    }
}
