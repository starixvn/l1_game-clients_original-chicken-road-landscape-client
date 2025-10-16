import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import LoadWebView from "db://shared-components/shared/common-components/web-view/load-web-view";
import Observer from "observer";

import { settings } from "../../../game-settings";
import { HashStore, ProvablyFair } from "../hash-store";
const { UrlUtils, PFVerification } = gc;
const { handle, render } = Observer;
const { ccclass, property } = _decorator;

@ccclass
export default class WebViewVerification extends LoadWebView {
    private provablyFair: ProvablyFair;
    @property(Label)
    lblRound: Label = null;

    onLoad() {
        super.onLoad();
        this.initUrl();
    }

    @handle(PFVerification.WebViewPFVerificationHandlers.GetVerificationURL)
    initUrl(specialDirection = "", scrollToId = "") {
        const theme = "original";
        return { theme, specialDirection, scrollToId };
    }

    @render(HashStore, (store) => store.verification)
    setProvablyFair(pf: ProvablyFair) {
        this.provablyFair = pf;
        this.lblRound.string = pf.roundId.toString();
    }

    sendDataToIframe(provablyFair: ProvablyFair) {
        const guideUrl = UrlUtils.getSubDomain(this.url);
        const gameTypeId = settings.gameTypeId;
        const data = { ...provablyFair, gameTypeId };
        this.onWebViewLoaded = () => {
            (document.getElementById("webview") as HTMLIFrameElement)?.contentWindow?.postMessage(JSON.stringify(data), guideUrl);
        };
    }

    @render(PFVerification.WebViewPFVerificationStore, (store) => store.url)
    loadVerificationGuide(url: string) {
        if (url) {
            this.url = url;
            this.sendDataToIframe(this.provablyFair);
            this.loadWebView();
        }
    }
    loadWebView() {
        if (this.url) {
            this.showLoading();
            this.hideWebView();

            this.webView.url = this.url;
        }
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickClose() {
        this.closeVerificationPopup();
    }

    @handle(gc.PFVerification.WebViewPFVerificationHandlers.VerificationPopupHandler)
    closeVerificationPopup() {
        return false;
    }
}
