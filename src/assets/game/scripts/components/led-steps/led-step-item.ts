import { _decorator, Component, Node } from "cc";
import Observer from "observer";
// import LandItem from "./land-item";

const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass("LedStepItem")
export class LedStepItem extends Component {
    @property(Node)
    stepDotActive: Node = null;

    toggleLedStepItemActive(isActive = true) {
        this.stepDotActive.active = isActive;
    }
}
