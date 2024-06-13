'use strict';

import { logging } from "/modules/logging.js";

$(document).ready(function () {
    initialize();
});

function initialize() {

    chrome.storage.onChanged.addListener((changes) => {

        if ("data" in changes) {
            updateView();
        }

    });

    $("#refresh-button").click((e) => {
        chrome.runtime.sendMessage("update");
    });

    $("#settings-button").click((e) => {
        chrome.runtime.openOptionsPage();
    });

    updateView();

}

function updateView() {

    logging.debug("[popup] Updating popup...");

    chrome.storage.session.get("data").then((result) => {

        const data = result.data;

        if (data) {
            $("#ip").text(data.ip);
            $("#country").text(data.country);
            $("#region").text(data.region);
            $("#isp").text(data.isp);
        } else {
            logging.warn("[popup] Updating view failed. No data in storage found.");
        }

    });

}
