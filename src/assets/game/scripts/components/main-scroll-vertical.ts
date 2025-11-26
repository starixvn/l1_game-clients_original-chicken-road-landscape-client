import { _decorator, find, Node, screen, ScrollView, sys, UITransform, v2 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetStore } from "./bets/bet-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("MainScrollVertical")
export class MainScrollVertical extends ObserverComponent {
    scrollView: ScrollView = null;

    onLoad(): void {
        this.scrollView = this.getComponent(ScrollView);
        super.onLoad();
    }

    @render(BetStore, store => store.eventEditBox)
    renderEventEditBox(eventEditBox: { name: string, node: Node }) {
        if (!eventEditBox) {
            return;
        }
        if (eventEditBox.name === 'Begin') {
            const node = eventEditBox.node;
            this.scrollToDisplayEditBox(node);
        }
    }

    private scrollToDisplayEditBox(node: Node) {
        if (sys.os !== sys.OS.IOS) {
            return;
        }

        const boxEdit = node.getComponent(UITransform).getBoundingBoxToWorld();
        const canvas = find("Canvas");
        const boxCanvas = canvas.getComponent(UITransform).getBoundingBoxToWorld();
        const keyboardHeight = 330 * screen.devicePixelRatio;
        const offset = boxCanvas.yMin + keyboardHeight - boxEdit.yMin;
        if (offset > 0) {
            const currentOffset = Math.abs(this.scrollView.getScrollOffset().y);
            this.scrollView.scrollToOffset(v2(0, currentOffset + offset), 0.3, true);
        }
    }
}