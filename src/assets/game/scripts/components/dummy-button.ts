import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AutoPlayStore } from "./play-mode/auto-play";
import { PreventSwallowNode } from "./prevent-swallow-node";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("DummyButton")
export class DummyButton extends ObserverComponent {
    onClick(event) {
        this.triggerClickEvent();
    }

    @handle(AutoPlayStore, handler => handler.triggerClickEvent('DummyButton'))
    triggerClickEvent() { }

    onLoad() {
        this.addComponent(PreventSwallowNode);
        this.node.on(Node.EventType.TOUCH_START, this.onClick, this);
        super.onLoad();
    }
}