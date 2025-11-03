import inversify from "inversify";
import mobx from "mobx";
import { FixedStepsMultiplierConfig } from "../../../game-configs/instant-win-config-store";
const { injectable, inject } = inversify;

@injectable()
export class AutoPlayStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    public roundsList = [10, 30, 50, 80, 100, 200, 500, 1000];
    public isOpenAutoplayPopup = false;
    public selectedRoundOnPopup = this.roundsList[0];
    public roundsAutoplay = 0;
    public triggerBet = null;

    isAutoplay = false;
    noOfLanes = 0;
    currentMultiplierConfig: FixedStepsMultiplierConfig = null;

    get isTurnOnAutoPlay() {
        return this.isOpenAutoplayPopup || this.isAutoplay;
    }
}
