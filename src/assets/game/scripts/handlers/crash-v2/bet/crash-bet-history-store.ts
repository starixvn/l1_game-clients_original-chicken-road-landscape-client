import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

export type DynamicObject<T> = {
    [key: string]: T;
};

export type BetHistoryLog = {
    time: string;
    roundId: number;
    win: number;
    betWin: number;
    totalAmount: number;
    freeBet: boolean;
    winLoss?: number;
    odds: DynamicObject<number>;
    result: DynamicObject<object>;
    settlementResult: DynamicObject<boolean>;
    betLogDetails?: Array<DynamicObject<object>>;
    verifiable?: boolean;
};

export type BetHistoryModel = {
    page: number;
    pageSize: number;
    total: number;
    betLogs: Array<BetHistoryLog>;
    fractionalOddsFormat?: boolean;
};

export type MyBetModel = {
    page: number;
    pageSize: number;
    total: number;
    betLogs: Array<BetHistoryLog>;
    fractionalOddsFormat?: boolean;
};

@injectable()
export class BetHistoryStore {
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    betHistoryModel: BetHistoryModel = null;

    setData(betHistoryModel: BetHistoryModel) {
        betHistoryModel.fractionalOddsFormat = this.mainPlayerStore?.fractionalOddsFormat;
        this.betHistoryModel = betHistoryModel;
    }
}

@injectable()
export class MyBetStore {
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    myBetModel: MyBetModel = null;
    settleStatus: { win: boolean; bet: number } = null;

    setData(myBetModel: MyBetModel) {
        myBetModel.fractionalOddsFormat = this.mainPlayerStore?.fractionalOddsFormat;
        this.myBetModel = myBetModel;
    }

    setSettleStatus(settleStatus: { win: boolean; bet: number }) {
        this.settleStatus = settleStatus;
    }
}
