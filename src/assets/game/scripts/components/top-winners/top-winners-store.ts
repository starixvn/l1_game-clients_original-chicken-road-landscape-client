import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

export interface TopWinner {
    roundId: number;
    name: string;
    amount: number;
    multiplier: number;
    winningAmount: number;
    rate: number;
}

@injectable()
export class TopWinnersStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    winners: TopWinner[] = [];

    newTopWinner: TopWinner = null;
}
