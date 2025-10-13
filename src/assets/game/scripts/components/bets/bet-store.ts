import inversify from "inversify";

import mobx from "mobx";

const { injectable, inject } = inversify;

export enum BetUIState {
    Start = 0,
    Started,
    Bet,
    Mining,
    CashOut,
    Settle,
    End,
}

export interface SettleStatus {
    win?: boolean;
    isBigWin?: boolean;
    reachMaxWin?: boolean;
    bet?: number;
}

enum AutoCashOutTiming {
    Start = 30,
    LastSeconds = 5,
}

@injectable()
export class BetStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    multiplier = 0;
    betCount = 0;
    endBet = 0;
    roundId = 0;
    settleStatus: SettleStatus = null;
    uiState = BetUIState.Start;
    isAutoStart = false;

    autoCashOutTimer = AutoCashOutTiming.Start;
    autoCashOutEnable = false;

    reachMaxWin = false;

    winAmount = 0;

    get autoCashOutTimerVisible() {
        return this.autoCashOutEnable && this.autoCashOutTimer <= AutoCashOutTiming.LastSeconds;
    }

    get multiplierVisible() {
        if (this.settleStatus && !this.settleStatus.win) {
            return false;
        }

        return this.uiState !== BetUIState.Start;
    }

    resetAutoCashOutTimer() {
        this.autoCashOutTimer = AutoCashOutTiming.Start;
    }
}
