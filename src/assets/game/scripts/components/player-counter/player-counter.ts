import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { IAroundTablePlayers } from "db://shared-components/game/around-table-player/scripts/stores/around-table-players-chip-store";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetStore } from "../bets/bet-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass("PlayerCounter")
export class PlayerCounter extends ObserverComponent {
    @property(Label)
    lblRoundId: Label = null;

    @property(Label)
    lblPlayerCount: Label = null;

    private playerCount = 0;

    onLoad() {
        this.updatePlayerCountLabel();
        super.onLoad();
    }

    @render(BetStore, (store) => store.roundId)
    renderLblRound(roundId: number) {
        this.lblRoundId && roundId !== 0 && (this.lblRoundId.string = `#${roundId}`);
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.aroundTablePlayer, { fireImmediately: false })
    renderAroundTablePlayer(aroundTablePlayer: IAroundTablePlayers) {
        if (!aroundTablePlayer) {
            return;
        }
        this.playerCount++;
        this.updatePlayerCountLabel();
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.aroundTablePlayers, { fireImmediately: false })
    renderAroundTablePlayers(aroundTablePlayers: gc.GameServiceMessage.AroundTablePlayers) {
        if (!aroundTablePlayers) {
            return;
        }
        const players: IAroundTablePlayers[] = Object.values(aroundTablePlayers);
        this.playerCount = players.length + 1;
        this.updatePlayerCountLabel();
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.outGamePlayerId, { fireImmediately: false })
    handleRemoveAroundTablePlayer(outGamePlayerId: gc.GameServiceMessage.RemoveAroundTablePlayer) {
        if (!outGamePlayerId) {
            return;
        }
        this.playerCount--;
        this.updatePlayerCountLabel();
    }

    private updatePlayerCountLabel() {
        this.lblPlayerCount.string = this.playerCount.toString();
    }
}
