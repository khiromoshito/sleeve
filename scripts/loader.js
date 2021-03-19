Router.onRoutingStart = (url) => {
    let _route_loader = document.createElement("div");
    _route_loader.id = "_route_loader";
    _route_loader.setAttribute("style", `
        background-color: crimson;
        height: 3px;
        width: 0%;
        position: fixed;
        top: 0;
        left: 0;
        transition: 50ms;
        z-index: 2000;
    `);
    document.body.appendChild(_route_loader);
}
Router.onRoutingProgress = (url, progress) => {
    let _route_loader = document.querySelector("#_route_loader");
    if(_route_loader) _route_loader.style.width = (progress*100) + "%";
}
Router.onRoutingSuccess = (url) => {
    let _route_loader = document.querySelector("#_route_loader");
    if(_route_loader && _route_loader.parentElement) 
        _route_loader.parentElement.removeChild(_route_loader);
}