import gc from "@sg/game-client-base";
import { log } from "cc";
import inversify from "inversify";
import mobx from "mobx";
import { InstantWinConfigStore } from "../../../game-configs/instant-win-config-store";
import { BetAmountStore } from "../../bet-amount/bet-amount-store";
import { BetHandler } from "../../bets/bet-handler";
import { BetStore, BetUIState } from "../../bets/bet-store";
import { AutoPlayStore } from "./auto-play-store";

const { injectable, inject } = inversify;

@injectable()
export class AutoPlayHandler implements gc.Shared.IHandler<number> {
    @inject(BetStore) private readonly betStore: BetStore;
    @inject(gc.Bet.BetStore) private readonly baseBetStore: gc.Bet.BetStore;
    @inject(BetAmountStore) protected readonly betAmountStore: BetAmountStore;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;
    @inject(gc.Error.ErrorStore) private readonly errorStore: gc.Error.ErrorStore;
    @inject(gc.Rounds.RoundStore) private readonly roundStore: gc.Rounds.RoundStore;
    @inject(InstantWinConfigStore) private readonly instantWinConfigStore: InstantWinConfigStore;
    @inject(AutoPlayStore) readonly autoPlayStore: AutoPlayStore;

    @inject(BetHandler) private readonly betHandler: BetHandler;

    constructor() {
        mobx.makeAutoObservable(this);
        setTimeout(() => {
            mobx.reaction(
                () => this.errorStore.apiError,
                (apiError) => {
                    if (apiError) {
                        this.cancelAutoPlay();
                    }
                }
            );
            mobx.reaction(
                () => this.instantWinConfigStore.currentMultiplierConfig,
                (currentMultiplierConfig) => {
                    this.autoPlayStore.currentMultiplierConfig = currentMultiplierConfig;
                    this.autoPlayStore.resetAutoSelection();
                }
            );
        }, 0);
    }

    handle() { }

    handleEnable(enable: boolean) {
        this.autoPlayStore.isAutoplay = enable;
    }

    handleNoOfLanes(noOfLanes: number) {
        this.autoPlayStore.noOfLanes = noOfLanes;
    }

    increaseNoOfLanes() {
        if (this.autoPlayStore.noOfLanes >= this.autoPlayStore.currentMultiplierConfig.multiplierSteps.length) {
            return;
        }
        this.autoPlayStore.noOfLanes++;
    }

    decreaseNoOfLanes() {
        if (this.autoPlayStore.noOfLanes <= 1) {
            return;
        }
        this.autoPlayStore.noOfLanes--;
    }

    async handleAutoPlaceBet() {
        if (this.checkFinishedAutoPlay() || !this.isValidBet()) {
            this.autoPlayStore.isAutoplay = false;
            this.autoPlayStore.isOpenAutoplayPopup = true;
            return;
        }

        this.autoPlaceBet();
    }

    autoPlaceBet() {
        if (this.betStore.uiState === BetUIState.Start) {
            this.countDownRoundAutoPlay();
        }
        this.betHandler.handle();
    }

    openAutoPlayPopup() {
        this.autoPlayStore.isOpenAutoplayPopup = true;
    }

    clickAutoPlay() {
        if (!this.autoPlayStore.isAutoplay && this.isValidBet()) {
            this.openAutoPlayPopup();
        } else {
            this.cancelAutoPlay();
        }
    }

    cancelAutoPlay() {
        this.autoPlayStore.isAutoplay = false;
        this.updateAutoPlayRounds(0);
    }

    isValidBet() {
        if (!this.isEnoughMoney()) {
            this.showNotEnoughMoney();
            return false;
        }

        return true;
    }

    isEnoughMoney() {
        return this.baseBetStore.amount <= this.baseBetStore.availableBalance;
    }

    isAmountGreaterMinBet() {
        return this.baseBetStore.amount >= this.roundStore.minBet;
    }

    private showNotEnoughMoney() {
        const { freebetEnabled } = this.baseBetStore;
        const message = freebetEnabled
            ? gc.Translator.commonTranslate("not_enough_scoin")
            : gc.Translator.commonTranslate("not_enough_money");
        this.noticeStore.addWarning(message);
    }

    showMsgMinBet() {
        this.noticeStore.addWarning(gc.Translator.commonTranslate("message_min_bet_notice", { minBet: this.roundStore.minBet }));
    }

    closeAutoPlayPopup() {
        this.autoPlayStore.isOpenAutoplayPopup = false;
    }

    confirmRoundAndStart() {
        log(`confirmRoundAndStart rounds: ${this.autoPlayStore.selectedRoundOnPopup}, 
            at step: ${this.autoPlayStore.noOfLanes}`);
        this.autoPlayStore.roundsAutoplay = this.autoPlayStore.selectedRoundOnPopup;
        this.autoPlayStore.isOpenAutoplayPopup = false;
        this.autoPlayStore.isAutoplay = true;
        if (this.isValidBet()) {
            this.autoPlaceBet();
        } else {
            this.cancelAutoPlay();
        }
    }

    private updateAutoPlayRounds(rounds: number) {
        this.autoPlayStore.roundsAutoplay = rounds;
    }

    countDownRoundAutoPlay() {
        this.updateAutoPlayRounds(this.autoPlayStore.roundsAutoplay - 1);
    }

    private checkFinishedAutoPlay() {
        return this.autoPlayStore.isAutoplay &&
            this.autoPlayStore.roundsAutoplay <= 0 &&
            this.betStore.uiState === BetUIState.Start;
    }

    checkAutoBetNextRound() {
        log("checkAutoBetNextRound");
        if (!this.autoPlayStore.isAutoplay || this.betStore.settleStatus) {
            return;
        }

        if (this.checkAutoCashOut()) {
            // cash out
            this.betHandler.handleCashOut();
            return;
        }

        this.handleAutoPlaceBet();
    }

    checkAutoCashOut() {
        const cashOutLand = this.autoPlayStore.noOfLanes;
        const cashOutMultiplier = this.autoPlayStore.currentMultiplierConfig.multiplierSteps[cashOutLand - 1];
        return this.betStore.multiplier === cashOutMultiplier;
    }

    updateNoOfRounds(rounds: number) {
        this.autoPlayStore.selectedRoundOnPopup = rounds;
    }
}
