'use strict';

import { 
    constants, 
    IconType, 
    IconTypeLabels, 
    LocationProvider, 
    LocationProviderLabels} from "/modules/constants.js"


$(document).ready(function() {
    
    initialize();

});

function initialize() {
    
    $("#save").click(saveData);
    
    $("#debug").change(onDebugChanged);
    
    populateLocationProviderDropdown();
    
    populateBadgeContentDropdown();
    
    onDebugChanged();
    
    loadData();
}


function populateLocationProviderDropdown() {

    const dropdown = $("#location-provider");
    dropdown.empty();
    
    Object.keys(LocationProvider).forEach((key) => {
        
        const value = LocationProvider[key];
        const label = LocationProviderLabels[value];
        const option = $('<option></option>');
        
        option.text(label);
        option.attr("id", `location_provider_${value}`); 
        option.attr("value", value);
        
        dropdown.append(option);

    });

}


function populateBadgeContentDropdown() {

    const dropdown = $("#badge-content");
    dropdown.empty();
    
    Object.keys(IconType).forEach((key) => {
        
        const value = IconType[key];
        const label = IconTypeLabels[value];
        const option = $('<option></option>');
        
        option.text(label);
        option.attr("id", `badge_content_${value}`); 
        option.attr("value", value);
        
        dropdown.append(option);
    
    });

}


function loadData() {

    chrome.storage.sync.get("settings").then((result) => {
    
        const settings = result.settings;
        
        if (! settings) {
            return;
        }
        
        $("#debug").prop("checked", settings.debug);
        $("#location-provider").val(settings.locationProvider);
        $("#badge-content").val(settings.badgeContent);
        $("#badge-color").val(settings.badgeColor);
  
    });

}

function saveData() {
  
    const settings = {
        debug: $("#debug").is(":checked"),
        locationProvider: $("#location-provider").val(),
        badgeContent: $("#badge-content").val(),
        badgeColor: $("#badge-color").val()
    }
    
    chrome.storage.sync.set({ settings }).then(() => {
        console.log("options: Settings saved.");
        $("#status").show();
        setTimeout(() => { $("#status").hide(); }, 2000);
    });

};


function onDebugChanged() {

    const debug = $("#debug").is(":checked");
    
    if (debug) {
    
        $("#location_provider_-1").css("display", "block");
        $("#badge_content_-1").css("display", "block");
    
    } else {
    
        $("#location_provider_-1").css("display", "none");

        if ($("#location_provider_-1").is(":selected")) {
            $("#location_provider_1").prop("selected", true);
        }

        $("#badge_content_-1").css("display", "none");

        if ($("#badge_content_-1").is(":selected")) {
            $("#badge_content_1").prop("selected", true);
        }

    }
    
}


