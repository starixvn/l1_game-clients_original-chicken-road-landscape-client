import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AutoPlayStore } from "./play-mode/auto-play";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("DummyButton")
export class DummyButton extends ObserverComponent {
    onClick(event) {
        this.triggerClickEvent();
        this.setUpPreventSwallow(event);
    }

    @handle(AutoPlayStore, handler => handler.triggerClickEvent('DummyButton'))
    triggerClickEvent() { }

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onClick, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.TOUCH_END, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.setUpPreventSwallow, this);

        this.node.on(Node.EventType.MOUSE_ENTER, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_MOVE, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_DOWN, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_UP, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_WHEEL, this.setUpPreventSwallow, this);

        super.onLoad();
    }

    setUpPreventSwallow(event) {
        event.preventSwallow = true;
        event.propagationStopped = false;
    }
}