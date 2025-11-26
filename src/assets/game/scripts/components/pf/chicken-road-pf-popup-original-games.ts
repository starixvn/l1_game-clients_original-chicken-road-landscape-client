import { _decorator, Label, Node } from "cc";

import gc from "@sg/game-client-base";
import { ProvablyFairPopup as ProvablyFairPopupRoundBase } from "db://shared-components/provably-fair/round-base/scripts/provably-fair-popup";
import Observer from "observer";
import { HashStore, ProvablyFair } from "../hash/hash-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

const { Shared, FormatUtils } = gc;
const { utils } = Shared;

@ccclass()
export class ChickenRoadPFPopupOriginalGames extends ProvablyFairPopupRoundBase {

    @property(Label)
    lblCrashPoint: Label = null;

    @property({ type: Node, visible: false, override: true })
    nodeResult: Node = null;

    @property({ type: Node, visible: false, override: true })
    clientSeedsContainer: Node = null;

    @render(HashStore, (store) => store.verification)
    protected renderVerification(verification: ProvablyFair) {
        if (!verification) {
            return;
        }

        super.renderVerification(verification);
        const { clientSeed, finalResult } = verification;
        this.lblCrashPoint.string = `${FormatUtils.numberWithCommas(finalResult, 2, false)}x`;

        clientSeed && this.lblMergeClientSeed.setString(clientSeed);
        this.lblMergeClientSeed.setActive(!!clientSeed);

        this.nodeDisabledVerification.active = false;
    }

}
