import * as i18n from "db://i18n/LanguageData";

import { _decorator, Component, RichText } from "cc";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("ProbablyFairRichText")
@executeInEditMode
export class ProbablyFairRichText extends Component {
    private richText: RichText | null = null;

    @property({ displayName: "Key" })
    private _key = "";

    get key(): string {
        return this._key;
    }

    set key(value: string) {
        if (this._key === value) {
            return;
        }
        this._key = value;
        this.updateRichText();
    }

    onLoad() {
        if (!i18n.ready) {
            i18n.init("en");
        }
        this.fetchRender();
    }

    private fetchRender(): void {
        const richText = this.getComponent(RichText);
        if (richText) {
            this.richText = richText;
            this.updateRichText();
        }
    }

    private updateRichText(): void {
        try {
            let text = i18n.t(this._key) || this._key;
            text = text.replace(
                "{provablyFairIcon}",
                "<img src='icon-pf-green' width='30' height='30' vertical-align='middle'/>"
            );
            if (this.richText) {
                this.richText.string = text;
            }
        } catch (e) {
            console.log(e);
        }
    }
}
