import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("PreventSwallowNode")
export class PreventSwallowNode extends ObserverComponent {
    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.TOUCH_END, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.setUpPreventSwallow, this);

        this.node.on(Node.EventType.MOUSE_ENTER, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_MOVE, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_DOWN, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_UP, this.setUpPreventSwallow, this);
        this.node.on(Node.EventType.MOUSE_WHEEL, this.setUpPreventSwallow, this);
    }

    setUpPreventSwallow(event) {
        event.preventSwallow = true;
        event.propagationStopped = false;
    }
}