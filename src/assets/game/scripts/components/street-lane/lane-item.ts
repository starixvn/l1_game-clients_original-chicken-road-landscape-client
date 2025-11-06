import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class LaneItem extends Component {
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

    @property(Node)
    barrierNode: Node = null;
    @property(Label)
    lblCurrentMultiplier: Label = null;

    @property(Node)
    currentStepMultiplierBg: Node = null;

    onLoad(): void {
        this.currentStepMultiplierBg.active = false;
        this.barrierNode.active = false;
    }

    toggleCurrentMultiplierBackground(isCurrentStep = true) {
        this.currentStepMultiplierBg.active = isCurrentStep;
        this.lblMultiplier.node.active = !isCurrentStep;
        this.lblCurrentMultiplier.node.active = isCurrentStep;
    }

    setMultiplier(multiplier: number) {
        const multiplierString = `${multiplier.toFixed(2)}x`;
        this.lblMultiplier.string = multiplierString;
        this.lblCurrentMultiplier.string = multiplierString;
    }
}
