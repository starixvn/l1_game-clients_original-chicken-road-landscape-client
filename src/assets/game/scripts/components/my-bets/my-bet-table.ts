import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from 'cc';
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";
import { MyBetTableBody } from "./my-bet-table-body";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";

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


