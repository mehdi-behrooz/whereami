
import { constants, IconType } from "./constants.js"

export class IconManager {

    static showErrorIcon() {
        chrome.action.setIcon({path: constants.SMALLER_ICON});
        chrome.action.setBadgeText({ text: "\u2716" });
    }

    static showIdleIcon() {
        chrome.action.setBadgeText({ text: "..." });
    }

    static updateIcon() {

        const promise1 = chrome.storage.sync.get("settings");
        const promise2 = chrome.storage.session.get("data");

        Promise.all([promise1, promise2]).then(([settingsResult, dataResult]) => {
            const data = dataResult.data;
            const settings = settingsResult.settings;
            if (! data) {
                return;
            }
            this.#updateIconBasedOn(data, settings);
        });

    }

    static #updateIconBasedOn(data, settings) {

        switch (parseInt(settings.badgeContent)) {

            case IconType.TIME:
                chrome.action.setIcon({path: constants.DEFAULT_ICON});
                const now = new Date();
                chrome.action.setBadgeText({ text: `${now.getHours()}:${now.getMinutes()}` });
                break;

            case IconType.NONE:
                chrome.action.setIcon({path: constants.DEFAULT_ICON});
                chrome.action.setBadgeText({ text: "" });
                break;

            case IconType.COUNTRY_CODE:
                chrome.action.setIcon({path: constants.DEFAULT_ICON});
                chrome.action.setBadgeTextColor({ color: settings.badgeColor });
                chrome.action.setBadgeText({ text: data.countryCode });
                break;

            case IconType.COUNTRY_FLAG:
                chrome.action.setBadgeText({ text: "" });
                this.#drawOnTopOfIcon(data.countryCode);
                break;

            case IconType.ISP:
                chrome.action.setIcon({path: constants.DEFAULT_ICON});
                chrome.action.setBadgeTextColor({ color: settings.badgeColor });
                chrome.action.setBadgeText({ text: data.isp.slice(0, 5) });
                break;
        }

    }

    static #drawOnTopOfIcon(countryCode) {

        const canvas = new OffscreenCanvas(32, 32);
        const context = canvas.getContext("2d");

        fetch(constants.DEFAULT_ICON)
            .then(response => response.blob())
            .then(blob => createImageBitmap(blob))
            .then(imageBitmap => context.drawImage(imageBitmap, 0, 0, 32, 32))
            .then(() => {

                const flagIcon = `/assets/flags/${countryCode}.png`.toLowerCase();
                const w = constants.COUNTRY_FLAG_WIDTH;
                const h = constants.COUNTRY_FLAG_HEIGHT;

                fetch(flagIcon)
                    .then(response => response.blob())
                    .then(blob => createImageBitmap(blob))
                    .then((imageBitmap) => {

                        context.drawImage(imageBitmap, 32 - w, 32 - h, w, h);
                        context.strokeRect(32 - w, 32 - h, w, h);

                        const imageData = context.getImageData(0, 0, 32, 32);
                        chrome.action.setIcon({ imageData: imageData });

                    });
            });

    }

}
