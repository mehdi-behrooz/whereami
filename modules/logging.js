export const logging = {
    
    debug: function() {
        console.debug(getTime(), ...arguments);
    },

    info: function() {
        console.info(getTime(), ...arguments);
    },

    warn: function() {
        console.warn(getTime(), ...arguments);
    },

    error: function() {
        console.error(getTime(), ...arguments);
    },

}

function getTime() {
    
    return new Date().toString();

}
