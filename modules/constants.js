
export const IconType = {

    TIME:           -1,
    NONE:           0,
    COUNTRY_CODE:   1,
    COUNTRY_FLAG:   2,
    ISP:            3,

}


export const IconTypeLabels = {

    [IconType.TIME]: "Last Update Time for Debug",
    [IconType.NONE]: "Nothing",
    [IconType.COUNTRY_CODE]: "Country Code",
    [IconType.COUNTRY_FLAG]: "Country Flag",
    [IconType.ISP]: "ISP"

}


export const LocationProvider = {

    FAKE: -1,
    IP_API: 1,
    IP_SB: 2

}


export const LocationProviderLabels = {

    [LocationProvider.FAKE]: "Random Locations for Debug",
    [LocationProvider.IP_API]: "ip-api.com",
    [LocationProvider.IP_SB]: "ip.sb"

}


export const DEFAULT_SETTINGS = {

    debug: false,
    locationProvider: 1,
    badgeContent: 1,
    badgeColor: "green"

}


export const constants = {

    ALARM_NAME: "update-location-alarm",
    ALARM_PERIOD_IN_MINUTES: 0.5,
    DEFAULT_ICON: "/assets/icon.png",
    COUNTRY_FLAG_WIDTH: 32,
    COUNTRY_FLAG_HEIGHT: 18,
    UPDATE_INTERVAL_IN_MILLISECONDS: 5 * 60 * 1000,

}
