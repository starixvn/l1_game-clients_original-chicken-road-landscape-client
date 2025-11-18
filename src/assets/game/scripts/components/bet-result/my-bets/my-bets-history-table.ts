import { _decorator, Component, instantiate, Node, Prefab } from "cc";

const { ccclass, property } = _decorator;

@ccclass("MyBetsHistoryTable")
export default class MyBetsHistoryTable extends Component {
    @property({ type: Node })
    headerContent: Node = null;

    @property({ type: Prefab })
    headerPrefab: Prefab = null;

    @property({ type: Node })
    bodyContent: Node = null;

    @property({ type: Prefab })
    bodyPrefab: Prefab = null;

    onLoad() {
        const header = instantiate(this.headerPrefab);
        this.headerContent.addChild(header);
        const body = instantiate(this.bodyPrefab);
        this.bodyContent.addChild(body);
    }
}
