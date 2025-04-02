
export { getCurrentLocation };

import { LocationProvider } from "./constants.js"
import { logging } from "./logging.js";

const FAKE_LOCATIONS = [
    ["France", "Paris", "FR"],
    ["Germany", "Berlin", "DE"],
    ["United Kingdom", "London", "GB"],
    ["United States", "New York", "US"],
    ["Iran", "Tehran", "IR"],
    ["Canada", "Toronto", "CA"],
    ["Italy", "Rome", "IT"]
]


function getCurrentLocation(onSuccess, onError, settings) {

    switch(parseInt(settings.locationProvider)) {

        case LocationProvider.FAKE:

            generateFakeLocation(onSuccess);

            break;

        case LocationProvider.IP_API:

            query_IP_API(onSuccess, onError);

            break;

        case LocationProvider.IP_SB:

            query_IP_SB(onSuccess, onError);

            break;

    }

}


function generateFakeLocation(onSuccess) {

    const ip = _getRandomInt(255) + "." + _getRandomInt(255) + "." + _getRandomInt(255) + "." + _getRandomInt(255);
    const [country, region, countryCode] = FAKE_LOCATIONS[_getRandomInt(FAKE_LOCATIONS.length)];
    const isp = "Cloudflare";

    const data = {
        ip: ip,
        country: country,
        countryCode: countryCode,
        isp: isp,
        region: region
    }

    setTimeout(() => { onSuccess(data); }, 1000);

}


function query_IP_API(onSuccess, onError) {

    logging.debug("[location provider] Querying ip-api.com...");

    fetch("http://ip-api.com/json")
            .then(response => response.json())
            .then(json => {

                logging.debug("[location provider] JSON received: ", json);

                onSuccess({
                        ip: json.query,
                        country: json.country,
                        countryCode: json.countryCode,
                        isp: json.org,
                        region: json.regionName,
                })

            })
            .catch(error => onError);

}


function query_IP_SB(onSuccess, onError) {

    logging.debug("[location provider] Querying ip.sb...");

    fetch("https://api-ipv4.ip.sb/geoip")
            .then(response => response.json())
            .then(json => {

                logging.debug("[location provider] JSON received: ", json);

                onSuccess({
                        ip: json.ip,
                        country: json.country,
                        countryCode: json.country_code,
                        isp: json.organization,
                        region: json.region,
                })

            })
            .catch(error => onError);


}


function _getRandomInt(max) {

    return Math.floor(Math.random() * max);

}
