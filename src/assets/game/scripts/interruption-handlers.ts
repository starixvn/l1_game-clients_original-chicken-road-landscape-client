import gc from "@sg/game-client-base";
import inversify from "inversify";
import { AutoPlayHandler } from "./components/play-mode/auto-play";
const { injectable, inject } = inversify;
@injectable()
export class InterruptionHandlers {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Notification.NotificationStore) protected readonly notificationStore: gc.Notification.NotificationStore;
    @inject(gc.Auth.AuthHandlers.TriggerRecheckIn) protected readonly triggerRecheckIn: gc.Auth.AuthHandlers.TriggerRecheckIn;
    @inject(AutoPlayHandler) protected readonly autoPlayHandler: AutoPlayHandler;

    onGameHide() {
        this.autoPlayHandler.interrupted = {};
    }

    onGameShow() {
        this.triggerRecheckIn.handle();
        if (!this.connectionStore.isConnected) {
            this.connectionStore.reconnect();
            this.autoPlayHandler.handleInterruption();
        }
        if (!this.notificationStore.isConnected) {
            this.notificationStore.reconnect();
        }
    }
}
