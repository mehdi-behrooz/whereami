'use strict';

import { getCurrentLocation } from "./location_provider.js";
import { constants, DEFAULT_SETTINGS } from "./constants.js"
import { IconManager } from "./iconmanager.js"
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

    IconManager.showIdleIcon();

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
    IconManager.updateIcon();
}


function updateLocationOnError(error) {
    IconManager.showErrorIcon();
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
