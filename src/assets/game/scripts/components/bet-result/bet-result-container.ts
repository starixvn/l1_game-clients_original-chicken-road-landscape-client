import { _decorator, Label, RichText } from "cc";
import { CrashUtils } from "../../crash-utils";
import { TabsControl } from "./tabs-control";
const { ccclass, property } = _decorator;

@ccclass("BetResultContainer")
export class BetResultContainer extends TabsControl {
    @property({ type: RichText })
    provablyFair: RichText;

    extendShowTab(index: number): void {
        this.tabButtons[index].getComponentInChildren(Label).color = CrashUtils.getColorActiveTab();
    }

    extendHideTab(index: number): void {
        this.tabButtons[index].getComponentInChildren(Label).color = CrashUtils.getColorInActiveTab();
    }
}
