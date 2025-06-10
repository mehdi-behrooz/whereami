'use strict';

import { getCurrentLocation } from "./location_provider.js";
import { constants, IconType, DEFAULT_SETTINGS } from "./constants.js"
import { logging } from "./logging.js";


chrome.runtime.onInstalled.addListener(({ reason }) => {
    clearAlarm();
    initialize();
});


chrome.runtime.onStartup.addListener(function () {
    clearAlarm();
    initialize();
});


chrome.tabs.onActivated.addListener(function () {
    initialize();
});


chrome.tabs.onUpdated.addListener(function () {
    initialize();
});


function initialize() {

    ensureSettings().then(() => {

        ensureSettingsListener();
        ensureAlarm();
        ensurePort();
        ensureLocation();

    });

}


function ensureSettings() {

    return new Promise((resolve) => {

        chrome.storage.sync.get("settings").then((result) => {

            const settings = result.settings;
            if (settings) {
                logging.debug("[background] Settings already exist.");
                resolve();
            } else {
                chrome.storage.sync.set({ settings: DEFAULT_SETTINGS }).then(() => {
                    logging.debug("[background] Default settings saved to memory.");
                    resolve();
                });
            }

        });

    });

}


function ensureSettingsListener() {

    chrome.storage.onChanged.addListener((changes) => {
        if ("settings" in changes) {
            updateIcon();
        }
    });

}


function clearAlarm() {
    chrome.alarms.clear(constants.ALARM_NAME);
}


function ensureAlarm() {

    chrome.alarms.get(constants.ALARM_NAME, alarm => {
        if (alarm) {
            logging.debug("[background] Alarm is already set.");
            return;
        }
        chrome.alarms.create(constants.ALARM_NAME, { periodInMinutes: constants.ALARM_PERIOD_IN_MINUTES });
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === constants.ALARM_NAME) {
                ensureLocation();
            }
        });
        logging.debug("[background] Alarm successfuly set.");
    });

}


function ensureLocation() {

    logging.debug("[background] Ensuring location...");

    chrome.storage.session.get("data").then((result) => {
        const data = result.data;
        if (! data) {
            logging.debug("[background] No previous data found. Location will be updated.");
            updateLocation();
            return;
        }
        const elapsedTime = Date.now() - data.timestamp;
        logging.debug(`[background] Latest update has happened ${elapsedTime} miliseconds ago.`);
        if (elapsedTime > constants.UPDATE_INTERVAL_IN_MILLISECONDS) {
            logging.debug("[background] Location will be updated.");
            updateLocation();
        }
    });

}


function updateLocation() {

    chrome.action.setBadgeText({ text: "..." });

    chrome.storage.sync.get("settings").then((result) => {
        const settings = result.settings;
        getCurrentLocation(
            updateLocationOnSuccess,
            updateLocationOnError,
            settings
        );
    });

}


function updateLocationOnSuccess(data) {

    logging.debug("[background] Location received: data = ", data);
    data.timestamp = Date.now();
    chrome.storage.session.set({ data })
    updateIcon();

}


function updateLocationOnError(error) {

    chrome.action.setIcon({path: constants.SMALLER_ICON});
    chrome.action.setBadgeText({ text: "\u2716" });
    logging.warn("[background] Error updating location: ", error);

}


function onMessageReceived(request, sender, sendResponse) {

    logging.debug("[background] Message received by background from sender: ", sender);
    logging.debug("[background] Request: ", request);
    if (request == "update") {
        updateLocation();
    }

}


function ensurePort() {

    if (chrome.runtime.onMessage.hasListener(onMessageReceived)) {
        logging.debug("[background] Port is alreay open.");
    } else {
        chrome.runtime.onMessage.addListener(onMessageReceived);
        logging.debug("[background] Port successfuly opened.");
    }

}


function updateIcon() {

    const promise1 = chrome.storage.sync.get("settings");
    const promise2 = chrome.storage.session.get("data");

    Promise.all([promise1, promise2]).then(([settingsResult, dataResult]) => {
        const data = dataResult.data;
        const settings = settingsResult.settings;
        if (! data) {
            return;
        }
        updateIconWith(data, settings);
    });

}


function updateIconWith(data, settings) {

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
            drawOnTopOfIcon(data.countryCode);
            break;

        case IconType.ISP:
            chrome.action.setIcon({path: constants.DEFAULT_ICON});
            chrome.action.setBadgeTextColor({ color: settings.badgeColor });
            chrome.action.setBadgeText({ text: data.isp.slice(0, 5) });
            break;
    }

}


function drawOnTopOfIcon(countryCode) {

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
