import { _decorator, Component, Label, Sprite, SpriteFrame } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class LandItem extends Component {
    @property(Label)
    lblMultiplier: Label = null;

    @property(Sprite)
    multiplierBg: Sprite = null;

    @property(SpriteFrame)
    defaultMultiplierBgFrame: SpriteFrame = null;

    @property(SpriteFrame)
    currentStepMultiplierBgFrame: SpriteFrame = null;

    @property(SpriteFrame)
    nextStepMultiplierBgFrame: SpriteFrame = null;
}
