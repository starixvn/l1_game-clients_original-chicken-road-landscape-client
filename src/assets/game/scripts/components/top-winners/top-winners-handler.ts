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

        winner.winningAmount = this.convertToMainPlayerRate(winner.winningAmount, winner.rate);
        winner.amount = this.convertToMainPlayerRate(winner.amount, winner.rate);

        this.store.newTopWinner = winner;

        const existingWinner = this.store.winners.find((w) => w.roundId === winner.roundId);
        if (existingWinner) {
            existingWinner.winningAmount = this.convertToMainPlayerRate(winner.winningAmount, winner.rate);

            existingWinner.multiplier = winner.multiplier;
        } else {
            this.store.winners.shift();
            this.store.winners.push(winner);
        }
    }

    createTopWinners(winners: TopWinner[]) {
        const lastTenWinner = winners.slice(-10);
        lastTenWinner.forEach((winner) => {
            winner.winningAmount = this.convertToMainPlayerRate(winner.winningAmount, winner.rate);
            winner.amount = this.convertToMainPlayerRate(winner.amount, winner.rate);
        });

        this.store.winners = lastTenWinner;
    }

    private convertToMainPlayerRate(amount: number, rate: number) {
        return gc.NumberUtils.getValueByCurrency(amount, this.mainPlayerStore.rate, rate);
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
