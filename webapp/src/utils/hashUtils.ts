export const getHashParams = () => {
    return window.location.hash
        .substring(1)
        .split("&")
        .reduce(function(inital: { [key: string]: any; }, item) {
            if (item) {
                var parts = item.split("=");
                inital[parts[0]] = decodeURIComponent(parts[1]);
            }
            return inital;
        }, {});
}

export const removeHashParams = () => {
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
}