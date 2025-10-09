import { _decorator, Component, Label } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class LandItem extends Component {
    @property(Label)
    lblMultiplier: Label = null;
}
