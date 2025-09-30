import gc from "@sg/game-client-base";
import {
    _decorator,
    Animation,
    BitmapFont,
    Button,
    EventTouch,
    Font,
    Intersection2D,
    Label,
    log,
    math,
    Node,
    PolygonCollider2D,
    sp,
    v3,
    Vec3,
} from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { AudioIds } from "../../../../audios/AudioIds";
import { changeCursorPointer, changePointerWhenHover, getCurrentAnimationLevel, MULTIPLIER_FONT_NAME, resetCursor } from "../../../utils";
import { BetHandler } from "../bet-handler";
import { BetStore, BetUIState } from "../bet-store";

const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export default class PlaceBetButton extends ObserverComponent {
    @property(Node)
    cashOutButton: Node = null;

    @property(Node)
    startBetButton: Node = null;

    @property(Node)
    hitStoneButton: Node = null;

    @property(Label)
    lblMultiplier: Label = null;

    @property(Label)
    lblMoney: Label = null;

    @property(Node)
    tapArea: Node = null;

    @property(sp.Skeleton)
    effect: sp.Skeleton = null;

    @property(sp.Skeleton)
    spineAxe: sp.Skeleton = null;

    @property(Node)
    levelUpNode: Node = null;

    @property(Node)
    debugNode: Node = null;

    private isStateBet = false;
    private upgradingAxe = false;
    private upgradeTimeStamp = 0;
    private multiplier = 0;
    private axeLevel = 1;
    private currentAnimationName = "";
    private readonly fontMultipliers: Font[] = [];
    private activeMoneyFont: Font = null;
    private disableMoneyFont: Font = null;
    private _levelUpSpine: sp.Skeleton = null;
    private _levelUpAxeSpine: sp.Skeleton = null;

    private readonly EFFECT_RESET_DELAY = 1;

    private realColliderRock: PolygonCollider2D = null;

    private startAxePosition: Vec3 = null;
    private nodeGuideHit: Node = null;
    private cashOutButtonInteractable = false;

    getLevelUpSpine() {
        if (!this._levelUpSpine) {
            this._levelUpSpine = this.levelUpNode.getChildByName("lv-up").getComponent(sp.Skeleton);
        }
        return this._levelUpSpine;
    }

    getLevelUpAxeSpine() {
        if (!this._levelUpAxeSpine) {
            this._levelUpAxeSpine = this.getLevelUpSpine()?.node?.getChildByName("axe")?.getComponent(sp.Skeleton);
        }
        return this._levelUpAxeSpine;
    }

    onLoad() {
        //this.loadFonts();
        this.levelUpNode.active = false;

        this.startAxePosition = v3(this.spineAxe.node.parent.position);
        this.realColliderRock = this.effect.getComponent(PolygonCollider2D);
        this.nodeGuideHit = this.hitStoneButton.getChildByName("hand");
        this.initializeAnimations();
        super.onLoad();
        this.addEvent();
    }

    async loadFonts() {
        bundleManager.loadAssetsFromBundle("resources", `fonts/yellow-number`, Font, null).then((font) => {
            try {
                this.activeMoneyFont = font;
                this.updateFontButtonCashOut();
            } catch (e) {}
        });
        bundleManager.loadAssetsFromBundle("resources", `fonts/gray-number`, Font, null).then((font) => {
            try {
                this.disableMoneyFont = font;
                this.updateFontButtonCashOut();
            } catch (e) {}
        });
        for (const fontName of MULTIPLIER_FONT_NAME) {
            const font = await bundleManager.loadAssetsFromBundle("resources", `fonts/${fontName}-number`, BitmapFont, null);
            this.fontMultipliers.push(font);
        }
    }

    onDestroy(): void {
        this.removeEvent();
        super.onDestroy();
    }

    private initializeAnimations(): void {
        this.hideAxe();
        this.resetEffect();
    }

    resetEffect() {
        this.effect && this.effect.setAnimation(0, "levitation", true);
    }

    @handle(BetHandler, (handler) => handler.handle())
    onBet() {
        this.unschedule(this.resetEffect);
        this.scheduleOnce(this.resetEffect, this.EFFECT_RESET_DELAY);
    }

    @handle(BetHandler, (handler) => handler.changeStarted())
    onClickStartBet() {
        this.playSound(AudioIds.BTN_START);
        this.showAxe();
    }

    @render(BetStore, (store) => store.settleStatus, { fireImmediately: false })
    handleCrash(settleStatus: any) {
        if (settleStatus) {
            !settleStatus.win && this.playCrashAnimation();
        } else {
            this.hideAxe();
        }
    }

    showAxe() {
        if (this.spineAxe) {
            this.spineAxe.node.active = true;

            this.resetAxe();
        }
    }

    hideAxe() {
        if (this.spineAxe) {
            this.spineAxe.node.active = false;
        }
    }

    @handle(BetHandler, (handler) => handler.handleCashOut())
    onClickCashOut() {
        this.playSound(AudioIds.BTN_CASHOUT);
        this.hideAxe();
    }

    @render(BetStore, (store) => store.multiplier)
    async updateMultiplier(multiplier: number) {
        try {
            this.multiplier = multiplier;
            const level = getCurrentAnimationLevel(multiplier);
            const upgradingAxe = this.axeLevel < level;

            const timeStamp = Date.now();
            if (upgradingAxe && !this.upgradingAxe) {
                this.upgradingAxe = true;
                this.upgradeTimeStamp = timeStamp;
            }

            const needPlayTapAnimation = this.multiplier > 1.0;
            if (needPlayTapAnimation) {
                this.playRandomHitSfx(level);
                await this.playTapAnimation();
            }

            this.lblMultiplier.string = `${gc.FormatUtils.numberWithCommas(multiplier, 2, false)}x`;
            this.updateMultiplierColor(level);

            if (this.upgradingAxe && timeStamp === this.upgradeTimeStamp) {
                this.playSound(AudioIds.CHANGE_AXE);
                await this.playAxeTransformation(level);
                this.upgradingAxe = false;
            }
            this.axeLevel = level;
        } catch (e) {}
    }

    playRandomHitSfx(level: number) {
        const randomIndex = Math.floor(Math.random() * 5);
        const hitSfx = `hit_lv${level}_0${randomIndex + 1}`;
        this.playSound(hitSfx);
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    showLevelUpAxe(show: boolean) {
        this.levelUpNode.active = show;
        this.getLevelUpSpine()?.node && (this.getLevelUpSpine().node.active = show);
        this.getLevelUpAxeSpine()?.node && (this.getLevelUpAxeSpine().node.active = show);
        this.spineAxe.node.active = !show;
    }

    async playAxeTransformation(level: number) {
        try {
            this.showLevelUpAxe(true);
            const levelUpSpine = this.getLevelUpSpine();
            const levelUpAxeSpine = this.getLevelUpAxeSpine();
            levelUpSpine && AnimationUtils.setOpacityNode(levelUpSpine.node, 255);
            levelUpAxeSpine && AnimationUtils.setOpacityNode(levelUpAxeSpine.node, 255);

            this.updateTapAnim(level);

            const lightSpineInfo = this.getTransformSpineInfo(level);
            const skeletonData = await this.loadAxeSpine(lightSpineInfo.name);
            if (levelUpAxeSpine) {
                levelUpAxeSpine.skeletonData = skeletonData;
                levelUpAxeSpine.setAnimation(0, lightSpineInfo.animation, false);
            }
            levelUpSpine && AnimationUtils.playSpine(levelUpSpine, "light", true);
            await AnimationUtils.delayTime(2.5);
            const fadeDuration = 0.5;
            levelUpSpine && AnimationUtils.fadeOut(levelUpSpine.node, fadeDuration);
            levelUpAxeSpine && (await AnimationUtils.fadeOut(levelUpAxeSpine.node, fadeDuration));

            this.showLevelUpAxe(false);
        } catch (e) {}
    }

    @render(BetStore, (store) => store.winAmount)
    updateCashOutValue(cashOutValue: number) {
        this.lblMoney.string = gc.FormatUtils.numberWithCommas(cashOutValue, 2, true);
    }

    updateMultiplierColor(level: number) {
        const index = level - 1;
        if (index < this.fontMultipliers.length) {
            this.lblMultiplier.font = this.fontMultipliers[index];
        } else {
            log("not exist font multiplier with index ", index);
        }
    }

    async updateTapAnim(level: number) {
        try {
            const kickSpineInfo = this.getKickSpineInfo(level);
            this.currentAnimationName = kickSpineInfo.animation;
            const skeletonData = await this.loadAxeSpine(kickSpineInfo.name);
            this.spineAxe.skeletonData = skeletonData;
            AnimationUtils.playSpineAtProgress(this.spineAxe, this.currentAnimationName, 0.9999);
        } catch (e) {}
    }

    loadAxeSpine(name: string) {
        return bundleManager.loadResourcesAsset<sp.SkeletonData>(`spines/axe/${name}`, sp.SkeletonData);
    }

    onClickBetButton() {
        if (this.canBet) {
            this.onBet();
        }
    }

    addEvent() {
        changePointerWhenHover(this.node);

        this.cashOutButton.on(Node.EventType.MOUSE_MOVE, changeCursorPointer, this);
        this.cashOutButton.on(Node.EventType.MOUSE_LEAVE, resetCursor, this);

        this.hitStoneButton.on(Node.EventType.MOUSE_MOVE, changeCursorPointer, this);
        this.hitStoneButton.on(Node.EventType.MOUSE_LEAVE, resetCursor, this);

        this.tapArea.on(Node.EventType.TOUCH_START, this.onTap, this);
        this.tapArea.on(Node.EventType.MOUSE_MOVE, this.validTapArea, this);
        this.tapArea.on(Node.EventType.MOUSE_LEAVE, resetCursor, this);
    }

    get canBet() {
        return this.isStateBet && !this.upgradingAxe;
    }

    validTapArea() {
        if (this.canBet) {
            changeCursorPointer();
        }
    }

    onTap(event: EventTouch) {
        if (this.touchInPolygon(event, this.tapArea) && this.canBet) {
            this.nodeGuideHit.active = false;
            this.onBet();

            const location = event.getUILocation();
            let tapLocation = v3(location.x, location.y, 0);
            if (!this.touchInPolygon(event, this.realColliderRock.node)) {
                tapLocation = this.findNearestPoint(tapLocation, this.realColliderRock);
            }

            this.debugNode.worldPosition = tapLocation;
            const axeNode = this.spineAxe.node.parent;
            axeNode.worldPosition = tapLocation;
            this.updateAxeDirection(axeNode);
        }
    }

    private updateAxeDirection(axeNode: Node) {
        const flip = axeNode.position.x < 0;
        const scaleX = flip ? -1 : 1;
        axeNode.scale = v3(scaleX, 1, 1);
        axeNode.angle = -scaleX * 30;
    }

    findNearestPoint(tapLocation: Vec3, collider: PolygonCollider2D) {
        const points = collider.worldPoints;
        let nearestIntersection = null;
        let minDistance = Number.MAX_VALUE;

        // Tìm tất cả giao điểm của đường thẳng đứng với các cạnh của polygon
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            // Kiểm tra nếu điểm tap nằm giữa x của 2 điểm đầu mút
            if ((tapLocation.x >= p1.x && tapLocation.x <= p2.x) || (tapLocation.x <= p1.x && tapLocation.x >= p2.x)) {
                // Tính y của giao điểm bằng phương trình đường thẳng
                const slope = (p2.y - p1.y) / (p2.x - p1.x);
                const intersectY = p1.y + slope * (tapLocation.x - p1.x);

                // Tính khoảng cách từ điểm tap đến giao điểm
                const distance = Math.abs(tapLocation.y - intersectY);

                // Cập nhật điểm gần nhất
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIntersection = v3(tapLocation.x, intersectY);
                }
            }
        }

        // Nếu không tìm thấy giao điểm nào, tìm điểm gần nhất trên các cạnh
        if (!nearestIntersection) {
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];

                // Tính điểm gần nhất trên cạnh
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const t = ((tapLocation.x - p1.x) * dx + (tapLocation.y - p1.y) * dy) / (dx * dx + dy * dy);

                // Giới hạn t trong đoạn [0,1]
                const clampedT = Math.max(0, Math.min(1, t));

                const nearestX = p1.x + clampedT * dx;
                const nearestY = p1.y + clampedT * dy;

                const distance = Math.sqrt(Math.pow(tapLocation.x - nearestX, 2) + Math.pow(tapLocation.y - nearestY, 2));

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIntersection = v3(nearestX, nearestY);
                }
            }
        }

        return nearestIntersection || v3(tapLocation.x, tapLocation.y);
    }

    protected touchInPolygon(event: EventTouch, node: Node) {
        const location = event.getUILocation();
        const polygon = node.getComponent(PolygonCollider2D).worldPoints;
        return Intersection2D.pointInPolygon(math.v2(location.x, location.y), polygon);
    }

    getKickSpineInfo(level: number) {
        return { name: `kick/pickaxe-${level}-kick-animation`, animation: `pickaxe-${level}-kick` };
    }

    getCrashSpineInfo(level: number) {
        return { name: `crash/pickaxe-${level}-crash-animation`, animation: `pickaxe-${level}-crash-animation` };
    }

    getTransformSpineInfo(level: number) {
        return { name: `level-up/pickaxe${level}/pickaxe${level}`, animation: `pickaxe${level}` };
    }

    async playTapAnimation() {
        this.effect.setAnimation(0, `tap_3`, false);

        const currentTapAnim = this.spineAxe;
        await AnimationUtils.playSpine(currentTapAnim, this.currentAnimationName, false);
    }

    async resetAxe() {
        await this.updateTapAnim(this.axeLevel);
        this.spineAxe.node.parent.position = v3(this.startAxePosition);
        this.updateAxeDirection(this.spineAxe.node.parent);
    }

    async playCrashAnimation() {
        try {
            const level = getCurrentAnimationLevel(this.multiplier);
            const crashSpineInfo = this.getCrashSpineInfo(level);
            const skeletonData = await this.loadAxeSpine(crashSpineInfo.name);
            this.spineAxe.skeletonData = skeletonData;
            this.playSound(AudioIds.CRASHED);
            await AnimationUtils.playSpine(this.spineAxe, crashSpineInfo.animation, false);
            this.hideAxe();
            this.completeSettle();
        } catch (e) {}
    }

    @handle(BetHandler, (handler) => handler.completeSettle())
    completeSettle() {}

    removeEvent() {}

    @render(BetStore, (store) => store.uiState)
    updateUIState(uiState: BetUIState) {
        this.startBetButton.active = uiState === BetUIState.Start;

        this.hitStoneButton.active = uiState >= BetUIState.Started;

        this.isStateBet = uiState > BetUIState.Start && uiState !== BetUIState.Settle;

        if (uiState === BetUIState.Started) {
            this.showAxe();
        }
    }

    @render(BetStore, (store) => store.multiplierVisible)
    updateMultiplierVisible(multiplierVisible: boolean) {
        this.lblMultiplier.node.active = multiplierVisible;
    }

    @render(BetStore, (store) => store.uiState)
    updateButtonInteractable(uiState: BetUIState) {
        const buttonCashOut = this.cashOutButton.getComponent(Button);
        buttonCashOut.interactable = uiState !== BetUIState.Settle && uiState !== BetUIState.Start && uiState !== BetUIState.Started;

        const hitStoneButton = this.hitStoneButton.getComponent(Button);
        hitStoneButton.interactable = uiState !== BetUIState.Settle;

        this.cashOutButtonInteractable = buttonCashOut.interactable;

        //this.updateFontButtonCashOut();
        const animation = this.lblMoney.getComponent(Animation);
        if (animation) {
            if (buttonCashOut.interactable) {
                animation.play();
            } else {
                animation.stop();
                this.lblMoney.node.scale = v3(1, 1, 1);
            }
        }
    }

    private updateFontButtonCashOut() {
        const font = this.cashOutButtonInteractable ? this.activeMoneyFont : this.disableMoneyFont;
        if (font) {
            this.lblMoney.font = font;
        }
    }
}
