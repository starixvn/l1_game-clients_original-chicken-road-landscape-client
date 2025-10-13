import { _decorator, instantiate, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { FixedStepsMultiplierConfig, InstantWinConfigStore } from "../../game-configs";
import { BetStore } from "../bets/bet-store";
import { LedStepItem } from "./led-step-item";
// import LandItem from "./land-item";

const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass("LedStepsContainer")
export class LedStepsContainer extends ObserverComponent {
    @property(Prefab)
    ledStepItemPrefab: Prefab = null;

    @property(Node)
    ledStepsContent: Node = null;

    private currentConfig: FixedStepsMultiplierConfig;

    onLoad() {
        super.onLoad();
    }

    @render(InstantWinConfigStore, (store) => store.currentMultiplierConfig, { fireImmediately: false })
    setMultiplierConfig(currentMultiplierConfig: FixedStepsMultiplierConfig) {
        this.currentConfig = currentMultiplierConfig;
        if (this.currentConfig) {
            this.renderLedSteps();
        }
    }

    @render(BetStore, (store) => store.betCount, { fireImmediately: false })
    setBetCount(betCount: number) {
        const currentStep = betCount;
        if (currentStep > 0) {
            this.ledStepsContent.children[currentStep - 1].getComponent(LedStepItem).toggleLedStepItemActive();
        } else {
            this.ledStepsContent.children.forEach((child) => {
                child.getComponent(LedStepItem).toggleLedStepItemActive(false);
            });
        }
    }

    renderLedSteps() {
        if (!this.ledStepItemPrefab || !this.ledStepsContent || !this.currentConfig) return;
        this.ledStepsContent.children.length > 0 && this.ledStepsContent.removeAllChildren();

        for (let i = 0; i < this.currentConfig.multiplierSteps.length; i++) {
            const ledStepItem = instantiate(this.ledStepItemPrefab);
            this.ledStepsContent.addChild(ledStepItem);
        }
        if (!this.ledStepsContent.active) {
            this.ledStepsContent.active = true;
        }
    }
}
