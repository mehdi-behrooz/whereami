'use strict';

import { getCurrentLocation } from "./location_provider.js";
import { constants, DEFAULT_SETTINGS } from "./constants.js"
import { IconManager } from "./iconmanager.js"
import { logging } from "./logging.js";


function addListener(event, f) {
    if (! event.hasListener(f)) {
        event.addListener(f);
    }
}

addListener(chrome.runtime.onInstalled, initialize);
addListener(chrome.runtime.onStartup, initialize);
addListener(chrome.windows.onFocusChanged, onTabChange);
addListener(chrome.tabs.onActivated, onTabChange);
addListener(chrome.tabs.onUpdated, onTabChange);
addListener(chrome.alarms.onAlarm, onAlarm);
addListener(chrome.storage.onChanged, onSettingsChanged);
addListener(chrome.runtime.onMessage, onMessage);


function initialize() {
    ensureSettings().then(() => {
        setupAlarm();
        updateLocation();
    });
}

function setupAlarm() {
    chrome.alarms.clearAll();
    chrome.alarms.create(constants.ALARM_NAME, { periodInMinutes: constants.ALARM_PERIOD_IN_MINUTES });
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

function onAlarm(alarm) {
    logging.debug("Alarm called.");
    updateLocation();
}

function onTabChange() {
    updateLocation();
}

function onSettingsChanged(changes) {
    if ("settings" in changes) {
        updateIcon();
    }
}

function onMessage(request, sender, _) {
    logging.debug(`[background] Message received from sender '${sender}' with request '${request}'`);
    if (request == "update") {
        updateLocationForced();
    }
}

function updateLocation() {
    logging.debug("[background] Updating location...");
    chrome.storage.session.get("data").then((result) => {
        const data = result.data;
        if (! data) {
            logging.debug("[background] No previous location data found. Location will be updated.");
            updateLocationForced();
            return;
        }
        const elapsedTime = Date.now() - data.timestamp;
        if (elapsedTime > constants.MIN_INTERVAL_BETWEEN_QUERIES) {
            logging.debug(`[background] Latest update has happened ${elapsedTime} miliseconds ago. Location will be updated.`);
            updateLocationForced();
        } else {
            logging.debug(`[background] Latest update has already happened ${elapsedTime} miliseconds ago. Skipping.`);
        }
    });
}

function updateLocationForced() {
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
    logging.warn("[background] Error updating location: ", error);
    IconManager.showErrorIcon();
}
