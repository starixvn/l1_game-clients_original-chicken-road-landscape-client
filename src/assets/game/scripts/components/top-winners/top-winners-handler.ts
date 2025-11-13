import gc from "@sg/game-client-base";
import inversify from "inversify";
import { TopWinner, TopWinnersStore } from "./top-winners-store";

const { injectable, inject } = inversify;
const { NumberUtils } = gc.Shared.utils;

@injectable()
export class TopWinnersHandlers {
    @inject(TopWinnersStore) private readonly store: TopWinnersStore;

    @inject(gc.Player.MainPlayerStore) private readonly mainPlayerStore: gc.Player.MainPlayerStore;

    @inject(gc.GameConfigs.GameConfigStore) private readonly gameConfigStore: gc.GameConfigs.GameConfigStore;

    addOrUpdateTopWinner(winner: TopWinner) {
        if (!this.gameConfigStore.initialized) {
            return;
        }

        const amount = gc.NumberUtils.getValueByCurrency(winner.winningAmount, this.mainPlayerStore.rate, winner.rate);

        winner.winningAmount = amount;

        this.store.newTopWinner = winner;

        const existingWinner = this.store.winners.find((w) => w.roundId === winner.roundId);
        if (existingWinner) {
            const amount = gc.NumberUtils.getValueByCurrency(winner.winningAmount, this.mainPlayerStore.rate, winner.rate);
            existingWinner.winningAmount = amount;
            existingWinner.multiplier = winner.multiplier;
        } else {
            this.store.winners.shift();
            this.store.winners.push(winner);
        }
    }

    createTopWinners(winners: TopWinner[]) {
        const lastTenWinner = winners.slice(-10);
        lastTenWinner.forEach((winner) => {
            const amount = gc.NumberUtils.getValueByCurrency(winner.winningAmount, this.mainPlayerStore.rate, winner.rate);
            winner.winningAmount = amount;
        });

        this.store.winners = lastTenWinner;
    }

    eventHandleList = [
        {
            name: "recentBet",
            handle: this.addOrUpdateTopWinner,
        },
        {
            name: "recentBets",
            handle: this.createTopWinners,
        },
    ];
}
