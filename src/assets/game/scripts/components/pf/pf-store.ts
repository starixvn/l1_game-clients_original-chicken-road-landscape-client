import inversify from "inversify";
import mobx from "mobx";
import { AutoPlayStore } from "../play-mode/auto-play";
const { injectable, inject } = inversify;

@injectable()
export class PfStore {
    @inject(AutoPlayStore) readonly autoPlayStore: AutoPlayStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    get isAutoplay() {
        return this.autoPlayStore.isAutoplay;
    }
}
