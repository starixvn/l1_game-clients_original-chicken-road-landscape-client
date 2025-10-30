import { _decorator, Component, Node } from "cc";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("GameModeItem")
export class GameModeItem extends Component {
    @property(Node)
    modeName: Node = null;

    @property(Node)
    hoverName: Node = null;

    private isSelected: boolean = false;

    onLoad() {
        // Add hover event listeners
        this.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    onDestroy() {
        // Remove event listeners to prevent memory leaks
        this.node.off(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    private onMouseEnter() {
        // Only respond to hover if item is not selected
        if (!this.isSelected) {
            if (this.hoverName) {
                this.hoverName.active = true;
            }
            if (this.modeName) {
                this.modeName.active = false;
            }
        }
    }

    private onMouseLeave() {
        // Only respond to hover if item is not selected
        if (!this.isSelected) {
            if (this.modeName) {
                this.modeName.active = true;
            }
            if (this.hoverName) {
                this.hoverName.active = false;
            }
        }
    }

    setSelectedItem(isSelected: boolean) {
        this.isSelected = isSelected;
    }

}
