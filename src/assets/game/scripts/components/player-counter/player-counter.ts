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
        super.onLoad();
    }

    @render(BetStore, (store) => store.roundId)
    renderlblRound(roundId: number) {
        this.lblRoundId && roundId !== 0 && (this.lblRoundId.string = `#${roundId}`);
    }
    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.aroundTablePlayer)
    renderAroundTablePlayer(aroundTablePlayer: IAroundTablePlayers) {
        if (aroundTablePlayer) {
            this.playerCount++;
        }
    }

    @render(gc.AroundTablePlayers.AroundTablePlayersStore, (store) => store.aroundTablePlayers)
    renderAroundTablePlayers(aroundTablePlayers: gc.GameServiceMessage.AroundTablePlayers) {
        if (aroundTablePlayers) {
            const players: IAroundTablePlayers[] = Object.values(aroundTablePlayers);
            this.playerCount = players.length;
        }

        this.lblPlayerCount.string = this.playerCount.toString();
    }
}
