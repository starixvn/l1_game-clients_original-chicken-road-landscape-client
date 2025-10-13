import { _decorator, Color, Label } from 'cc';
import { TabsControl } from './tabs-control/tabs-control';
const { ccclass, property } = _decorator;

@ccclass('BetResultContainer')
export class BetResultContainer extends TabsControl {
    extendShowTab(index: number): void {
        this.tabButtons[index].getComponentInChildren(Label).color = Color.WHITE;
    }

    extendHideTab(index: number): void {
        this.tabButtons[index].getComponentInChildren(Label).color = Color.GRAY;
    }
}


