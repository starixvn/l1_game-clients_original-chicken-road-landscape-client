import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { InstantWinConfigStore } from "../../game-configs/instant-win-config-store";
import { BetStore } from "../bets/bet-store";
import { AutoPlayStore } from "../play-mode/auto-play/auto-play-store";
const { injectable, inject } = inversify;

@injectable()
export class BetAmountStore {
    @inject(gc.Bet.BetStore) private readonly betBaseStore: gc.Bet.BetStore;
    @inject(BetStore) private readonly betStore: BetStore;
    @inject(InstantWinConfigStore) gameConfig: InstantWinConfigStore;
    @inject(gc.Player.MainPlayerStore) mainPlayerStore: gc.Player.MainPlayerStore;
    @inject(AutoPlayStore) private readonly autoPlayStore: AutoPlayStore;

    constructor() {
        mobx.makeAutoObservable(this);
        setTimeout(() => {
            mobx.reaction(() => this.betBaseStore.amount, (amount) => {
                this.syncAmount(amount);
            });
        }, 100);
    }

    isOpenBetAmountPopup = false;

    amount = {}

    syncAmount(amount: number) {
        this.amount = {
            value: amount,
        };
    }

    get betLevels() {
        return this.gameConfig.betLevels.slice(0, 3);
    }

    get disabledBetAmount() {
        if (this.autoPlayStore.isAutoplay) {
            return true;
        }
        return this.betStore.endBet > 0;
    }

    get isMinBetLevelValue() {
        return this.betBaseStore.amount <= this.gameConfig.minBet;
    }

    get isMaxbetLevelValue() {
        return this.betBaseStore.amount >= this.gameConfig.maxBet;
    }
}
