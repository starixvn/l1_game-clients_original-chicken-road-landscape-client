import { _decorator, Color, Component } from "cc";
const { ccclass, property } = _decorator;

export class CrashUtils extends Component {
    static readonly config = {
        thresholds: [2, 5, 10],
        colors: ["01d8ff", "FFD900", "ff010d", "D608FB"],
        colorNames: ["blue", "orange", "red", "purple"],
        bgMultiplierColor: ["393939", "003cff", "f8c100"],
        whiteColor: "E6E5DF",
        tabColors: {
            Active: "ffffff",
            InActive: "ffffff",
        },
    };
    static readonly betEventNames = {
        cashOut: "cashOut",
        refund: "refund",
    };
    static getMultiplierIndex(multiplier: number): number {
        const index = CrashUtils.config.thresholds.findIndex((threshold) => multiplier <= threshold);
        return index === -1 ? CrashUtils.config.thresholds.length : index;
    }

    static getMultiplierColor(multiplier: number): Color {
        const index = CrashUtils.getMultiplierIndex(multiplier);
        return new Color().fromHEX(CrashUtils.config.colors[index]);
    }

    static getBgMultiplierColor(index: number): Color {
        return new Color().fromHEX(CrashUtils.config.bgMultiplierColor[index]);
    }

    static getColorActiveTab(): Color {
        return new Color().fromHEX(CrashUtils.config.tabColors.Active);
    }

    static getColorInActiveTab(): Color {
        return new Color().fromHEX(CrashUtils.config.tabColors.InActive);
    }

    static getWhiteColor(): Color {
        return new Color().fromHEX(CrashUtils.config.whiteColor);
    }

    static getMultiplierColorByIndex(index: number): Color {
        return new Color().fromHEX(CrashUtils.config.colors[index]);
    }

    static getMultiplierColorName(index: number): string {
        return CrashUtils.config.colorNames[index];
    }

    static getFontMultiplier(multiplierIndex: number): string {
        return multiplierIndex < CrashUtils.config.colorNames.length
            ? `${CrashUtils.config.colorNames[multiplierIndex]}-number`
            : CrashUtils.config.colorNames[CrashUtils.config.colorNames.length - 1];
    }

    static encryptedName(name: string): string {
        return `${name.substring(0, 1)}***${name.substring(name.length - 3, name.length)}`;
    }

    static formatDate(isoString: string): string {
        const date = new Date(isoString);

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    static formatTime(isoString: string): string {
        const date = new Date(isoString);

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
    }
}
