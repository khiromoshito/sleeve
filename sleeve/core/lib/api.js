class SleeveAPI {
    static fetchText = (url, callback) => {
        fetch(url).then(res=>res.text().then(res=>callback(res)));
    }

}