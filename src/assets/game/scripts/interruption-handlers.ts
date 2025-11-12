import gc from "@sg/game-client-base";
import inversify from "inversify";
import { BetHandler } from "./components/bets/bet-handler";
const { injectable, inject } = inversify;

@injectable()
export class InterruptionHandlers {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Notification.NotificationStore) protected readonly notificationStore: gc.Notification.NotificationStore;
    @inject(gc.Auth.AuthHandlers.TriggerRecheckIn) protected readonly triggerRecheckIn: gc.Auth.AuthHandlers.TriggerRecheckIn;
    @inject(BetHandler) protected readonly betHandler: BetHandler;

    onGameHide() { }

    onGameShow() {
        this.triggerRecheckIn.handle();
        if (!this.connectionStore.isConnected) {
            this.connectionStore.reconnect();
            this.betHandler.handleInterruption();
        }
        if (!this.notificationStore.isConnected) {
            this.notificationStore.reconnect();
        }
    }
}
