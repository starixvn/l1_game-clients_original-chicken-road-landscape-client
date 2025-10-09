import { FixedStepsMultiplierConfig } from "./game-configs";

export namespace GameServiceMessage {
    export class InstantGameConfigs {
        defaultBetLevel: number;
        chips: number[];
        fixedStepsMultiplierConfigs: FixedStepsMultiplierConfig[];

        static eventName = "gameConfigs";
    }

    export const MultiplierEvent = "multiplier";
    export const EndBetEvent = "endBet";
    export const RoundId = "roundId";

    export class ResultHash {
        hashValue: string;

        static eventName = "resultHash";
    }

    export class ProvablyFair {
        serverSeed: string;
        serverSeedHash: string;
        finalHash: string;
        clientSeed: string;
        finalResult: number;
        roundId: number;

        static eventName = "provablyFair";
    }

    export class Status {
        win: boolean;
        bet: number;
        reachMaxWin: boolean;

        static eventName = "status";
    }

    export class Player {
        name: string;
        betWin: number;
        bigWin: boolean;

        static eventName = "player";
    }

    export const ReachMaxWinEvent = "reachMaxWin";
    export const WinAmountEvent = "winAmount";
}
