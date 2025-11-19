import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, Sprite, Toggle, ToggleContainer } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { AudioIds } from "../../../audios/AudioIds";
const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass("TabsControl")
export class TabsControl extends ObserverComponent {
    @property({ type: ToggleContainer })
    toggleGroup: ToggleContainer = null;

    @property({ type: [Node] })
    tabButtons: Toggle[] = [];

    @property({ type: [Node] })
    tabContents: Node[] = [];

    @property({ type: [Prefab] })
    prefabContents: Prefab[] = [];

    private readonly prefabInstances: Map<number, Node> = new Map();
    private currentTabIndex = -1;

    onLoad() {
        this.initializeToggles();
        this.selectInitialTab();
        super.onLoad();
    }

    private initializeToggles() {
        const toggles = this.toggleGroup.getComponentsInChildren(Toggle);
        toggles.forEach((toggle, index) => {
            toggle.node.on(Toggle.EventType.CLICK, () => this.handleTabChange(index));
        });
    }

    private selectInitialTab() {
        const firstToggle = this.toggleGroup.getComponentsInChildren(Toggle)[0];
        if (firstToggle) {
            firstToggle.isChecked = true;
            this.handleTabChange(0);
        }
    }

    private handleTabChange(index: number) {
        if (index === this.currentTabIndex) {
            return;
        }

        this.playSFX(AudioIds.CLICK);
        this.currentTabIndex = index;
        this.updateTabVisibility(index);
    }

    private updateTabVisibility(activeIndex: number) {
        this.tabContents.forEach((content, index) => {
            const isActive = index === activeIndex;
            content.active = isActive;
            this.tabButtons[index].getComponent(Sprite).enabled = isActive;

            if (isActive) {
                this.showTab(index);
            } else {
                this.hideTab(index);
            }
        });
    }

    @handle(gc.Audios.AudioHandler, (handler, id: string) => handler.playSFX(id))
    private playSFX(audioId: string) {
        return audioId;
    }

    private showTab(index: number) {
        if (!this.prefabInstances.has(index)) {
            const instance = instantiate(this.prefabContents[index]);
            this.prefabInstances.set(index, instance);
            this.tabContents[index].addChild(instance);
        } else {
            this.prefabInstances.get(index).active = true;
        }
        this.extendShowTab(index);
    }

    protected extendShowTab(index: number) {}

    private hideTab(index: number) {
        if (this.prefabInstances.has(index)) {
            this.prefabInstances.get(index).active = false;
        }
        this.extendHideTab(index);
    }

    protected extendHideTab(index: number) {}

    onDestroy() {
        if (!this.toggleGroup?.node) {
            return;
        }

        const toggles = this.toggleGroup.getComponentsInChildren(Toggle);
        toggles.forEach((toggle) => {
            toggle.node.off(Toggle.EventType.CLICK);
        });
    }
}
