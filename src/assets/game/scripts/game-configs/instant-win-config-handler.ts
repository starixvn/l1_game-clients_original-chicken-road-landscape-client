import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessage } from "../game-message";
import { InstantWinConfigStore } from "./instant-win-config-store";
const { injectable, inject } = inversify;

@injectable()
export class InstantWinConfigHandler implements gc.Shared.IMultipleHandlers {
    @inject(InstantWinConfigStore) protected readonly instantWinConfigStore: InstantWinConfigStore;
    @inject(gc.GameConfigs.GameConfigStore) protected readonly gameConfigStore: gc.GameConfigs.GameConfigStore;
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;

    handleGameConfigs(gameConfigs: GameServiceMessage.InstantGameConfigs) {
        this.instantWinConfigStore.minBet = Math.max(this.gameConfigStore.minBet, this.mainPlayerStore.stakeLevel.minBet);
        this.instantWinConfigStore.maxBet = Math.min(this.gameConfigStore.maxBet, this.mainPlayerStore.stakeLevel.maxBet);
        this.instantWinConfigStore.betLevels = gameConfigs.chips
            .map(chip => parseInt(chip.toString()))
            .filter((value) => value >= this.instantWinConfigStore.minBet && value <= this.instantWinConfigStore.maxBet);
        this.instantWinConfigStore.defaultBetLevel = gameConfigs.defaultBetLevel;
        this.instantWinConfigStore.fixedStepsMultiplierConfigs = gameConfigs.fixedStepsMultiplierConfigs;
        if (gameConfigs.fixedStepsMultiplierConfigs.length > 0) {
            this.setCurrentMultiplierConfig(gameConfigs.fixedStepsMultiplierConfigs[0].mode);
        }
    }

    eventHandleList = [
        {
            name: GameServiceMessage.InstantGameConfigs.eventName,
            handle: this.handleGameConfigs,
        },
    ];

    setCurrentMultiplierConfig(mode: number) {
        this.instantWinConfigStore.currentMultiplierConfig = this.instantWinConfigStore.fixedStepsMultiplierConfigs.find(config => config.mode === mode);
    }
}
