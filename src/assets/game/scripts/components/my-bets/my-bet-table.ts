import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from 'cc';
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { render } = Observer;
const { BetHistory } = gc;

@ccclass('MyBetTable')
export class MyBetTable extends ObserverComponent {
    @property({ type: Node })
    bodyContent: Node = null;

    @property({ type: Prefab })
    bodyPrefab: Prefab = null;



    onLoad() {
        const body = instantiate(this.bodyPrefab);
        this.bodyContent.addChild(body);
    }
}


