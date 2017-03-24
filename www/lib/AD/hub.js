import 'lib/OpenAjax.js';

export default {
    publish(key, data) {
        OpenAjax.hub.publish(key, data);
    },
    subscribe(key, callback) {
        return OpenAjax.hub.subscribe(key, callback);
    },
    unsubscribe(id) {
        OpenAjax.hub.unsubscribe(id);
    }
};
