var Global = {
    /** Stack of routes that contain the documentElement.children */
    routeStack: []
};

var ContentHandler = {
    _content: {},

    setContentFromJSONUrl: (url) => {
        console.log("Loading JSON...");
        fetch(url)
            .catch(e=>console.log("Error loading JSON: " + e))
            .then(res=>res.json())
            .catch(e=>console.log("Error processing JSON: " + e))
            .then(res=>{
            ContentHandler.setContent(res);
        }).catch(e=>console.log("Error finalising JSON: " + e));
    },

    setContent: (content) => {


        Object.keys(content).forEach(content_name=>{
            ContentHandler._content[content_name]
                = content[content_name];
        });
        ContentHandler.displayAll();
    },

    clear: () => {
        ContentHandler._content = {};
        ContentHandler.displayAll();
    },

    set: (name, value) => {
        ContentHandler._content[name] = value;
        ContentHandler.display(name);
    },

    displayAll: () => {
        let content_elements = document.querySelectorAll("[content]");
        content_elements.forEach(el=>{
            let content_name = el.getAttribute("content");
            let content_value = ContentHandler.get(content_name);
            if(content_value) el.innerHTML = content_value;
        });
        
    },

    display: (name) => {
        let content_elements = document.querySelectorAll(`[content='${name}']`);
        content_elements.forEach(el=>{
            let content_value = ContentHandler.get(name);
            el.innerHTML = content_value || "";
        });
    },

    get: (name) => {
        return ContentHandler._content[name] || null;
    },

    stringToNode: (nodestring) => {
        let temp_parent = document.createElement("div");
        temp_parent.innerHTML = nodestring;
        return temp_parent.firstChild;
    }
}



var _past_route_mode = PageRoute ? PageRoute._current_route_mode : (history.state ? history.state.route_mode : null);

var PageRoute = {

    _current_location: window.location.href,
    _current_route_mode: _past_route_mode,
    _current_route_data: "",
    isWindowLoaded: false,
    _is_processing: false,

    relocatePaths: function (root = document, base = RouteUtils.sliceUrl(location.href).basef) {
        base = base.replace(/\/$/, "");
        console.log(base);
        root.querySelectorAll("[src]").forEach(el=>{
            let src = el.getAttribute("src") || el.src;
            src = base + "/" + src;
    
            el.setAttribute("src", src);
        });
        root.querySelectorAll("[href]").forEach(el=>{
            let href = el.getAttribute("href") || el.href;
            href = base + "/" + href;
    
            el.setAttribute("href", href);
        });
    },


    setView: (url, content) => {
        fetch(url)
        .then(res=>res.text()
        .then(res=>{

            let when_loaded = () => {
                document.documentElement.innerHTML = res;
                ContentHandler.setContent(content);
            };

            if(PageRoute.isWindowLoaded)
                when_loaded();
            else 
                window.addEventListener("load", when_loaded);

        }).catch(e=>console.log("Error loading view: " + e)))
        .catch(e=>console.log("Error processing view: " + e));
    },

    setViewWithJSONUrl: (view_url, json_url) => {

    },


    toRoute: (url, state = {}) => {
        PageRoute.onRoutingStart(url);
        fetch(url).
        then(res=>res.text()
        .then(res=>{
            console.log(res);
            PageRoute.onRoutingSuccess(url);

            history.pushState(state, "", url);
            document.write(res);
        }).catch(e=>{
            console.log("Error loading page: " + e);
            PageRoute.onRoutingError(url, e);
        }))
        .catch(e=>{
            console.log("Error processing page: " + e);
            PageRoute.onRoutingError(url, e);
        });
    },

    toContentRoute: (url, callback = () => {}, thenState = () => {}) => {
        console.clear();
        PageRoute.onRoutingStart(url);
        PageRoute.onRoutingProgress(url, 0.4);

        let route_data = null;


        let processRoute = () => {
            //console.log(res);
            PageRoute.onRoutingProgress(url, 0.8);

            if(history.state)
                history.replaceState({...history.state, route_data: route_data, route_src: url}, "");
            else
            history.replaceState({route_data: route_data, route_src: url}, "");


            let base_url = RouteUtils.sliceUrl(url).basef;
            console.log("--- base url: " + base_url);

            // list all content values
            let contents = {};

            let temp = document.createElement("html");
            temp.innerHTML = route_data;
            PageRoute.relocatePaths(temp, base_url);


            temp.querySelectorAll("content").forEach(el=>{
                if(el.hasAttribute("name")) {
                    let content_name = el.getAttribute("name");
                    let content_value = el.innerHTML.trim();

                    contents[content_name] = content_value;
                }
            });

            window.scroll(0, 0);
            ContentHandler.setContent(contents);
            
            if(window.hasSleeve) Sleeve.initialise();
            callback();

            PageRoute.onRoutingProgress(url, 1);
            setTimeout(()=>{
                PageRoute.onRoutingSuccess(url);
                PageRoute.preloadRoutes();
            }, 100);
            
        }

        let preloaded = PageRoute._preloaded_routes[url];
        if(preloaded) {
            if(preloaded==404) {
                location.href = url;
            } else if(preloaded[0]) {
                route_data = preloaded[1];
                thenState();
                processRoute();
            } else {
                PageRoute._preloading_callbacks[url]
                    = function(res){
                        route_data = res;
                        thenState();
                        processRoute();
                    };
            }
        } else {
            fetch(url).
            then(res=>res.text()
            .then(res=>{
                route_data = res;
                processRoute();
            }).catch(e=>{
                console.log("Error loading page: " + e);
                PageRoute.onRoutingError(url, e);
            }))
            .catch(e=>{
                console.log("Error processing page: " + e);
                PageRoute.onRoutingError(url, e);
            });
        }
        

        
    },

    toPageRoute: (url, callback = () => {}, thenState = () => {}) => {
        PageRoute.onRoutingStart(url);
        PageRoute.onRoutingProgress(url, 0.1);
        
        let route_data = null;

        let processRoute = () => {

            let temp_page = document.createElement("html");
            temp_page.innerHTML = route_data;


            if(history.state)
                history.replaceState({...history.state, route_data: route_data, route_src: url}, "");
            else
            history.replaceState({route_data: route_data, route_src: url}, "");



            
            console.clear();

            let updateProgress = (progress) => {
                console.log("---- Loaded " + Math.round(progress) + "%");
                PageRoute.onRoutingProgress(url, progress/100);
            }

            updateProgress(40);

            ResourceLoader.loadRouteView(temp_page, ()=>{}, ()=>{
                console.log("---- Loaded 60%");

                ResourceLoader.loadSuitStyles(temp_page, (i, t)=>{
                        updateProgress(((i/t)*20)+60);
                    }, 
                    ()=>{
                        ResourceLoader.loadScripts(temp_page, (i, t)=>{
                            updateProgress(((i/t)*20)+80);
                        }, 
                        ()=>{
                            setTimeout(()=>{
                                document.write(temp_page.innerHTML);
                                document.close();
                                PageRoute.onRoutingSuccess(url);
                            
                                callback();
                                console.log("DONE!!!");
                            }, 100);
                            
                        });
                });
            });

        };

        let preloaded = PageRoute._preloaded_routes[url];
        if(preloaded) {
            if(preloaded==404) {
                location.href = url;
            } else if(preloaded[0]) {
                route_data = preloaded[1];
                thenState();
                processRoute();
            } else {
                PageRoute._preloading_callbacks[url]
                    = function(res){
                        route_data = res;
                        thenState();
                        processRoute();
                    };
            }
        } else {
            fetch(url).
            then(res=>res.text()
            .then(res=>{
                route_data = res;
                processRoute();
            }).catch(e=>{
                console.log("Error loading page: " + e);
                PageRoute.onRoutingError(url, e);
            }))
            .catch(e=>{
                console.log("Error processing page: " + e);
                PageRoute.onRoutingError(url, e);
            });
        }


    },

    _preloaded_routes: {},
    _preloading_callbacks: {},

    preloadRoutes: () => {
        // Href from routing links are preloaded while user does not navigate
        // But only if total number of links is less than threshold count (20)

        

        let page_routing_elements = document.querySelectorAll("[page-routing][href]");
        let content_routing_elements = document.querySelectorAll("[content-routing][href]");

        let links = [];


        // Preload recent page
        // If route_data was stored:

        if(history.state && history.state.route_data && history.state.route_src) {
            PageRoute._preloaded_routes[history.state.route_src]
             = [true, history.state.route_data];
        } else links.push(location.href);

        page_routing_elements.forEach(el=>links.push(el.getAttribute("href")));
        content_routing_elements.forEach(el=>links.push(el.getAttribute("href")));

        console.log("Preparing " + links.length + " routing links.", links);

        links.forEach(link=>{
            if(!PageRoute._preloaded_routes[link]) {
                PageRoute._preloaded_routes[link] = [false, ""];
                fetch(link).then(
                    res=> res.status != 404 ? res.text().then(
                        res=>{
                            PageRoute._preloaded_routes[link] = [true, res];
                            (PageRoute._preloading_callbacks[link] || function(_){})(res);
                        }
                    ) : PageRoute._preloaded_routes[link] = 404
                );
            }
        });
    },

    onRoutingStart: (url) => {},
    onRoutingError: (url, e) => {},
    onRoutingSuccess: (url) => {},
    onRoutingProgress: (url, progress) => {}


}


// Checks external resources inside a root element, 
// and replaces them as innerText

var ResourceLoader = {
    loadRouteView: (root, progressCallback, callback = () => {}) => {
        let route_element = root.querySelector("route[view]");
        if(route_element) {
            let view_src = route_element.getAttribute("view");
            fetch(view_src).then(
                res=>res.text().then(res=>{
                    //console.log("------------ LOADED ROUTEVIEW: ", route_element);
                    route_element.insertAdjacentHTML("afterend", 
                        "<preloaded-route-view>"+res+"</preloaded-route-view>");
                    progressCallback();
                    callback();
                })
            );
        } else {
            progressCallback();
            callback();
        }
    },
    loadSuitStyles: (root, progressCallback, callback = () => {}) => {
        let suit_styles = [];
        let finished_suit_styles = 0;


        let finished_load = () => {
            finished_suit_styles++;
            progressCallback(finished_suit_styles, suit_styles.length);
            if(finished_suit_styles>=suit_styles.length)
                callback();
        }

        // Get all valid sources
        root.querySelectorAll("suit-style[src]").forEach(sel=>{
            if(sel.getAttribute("src")) suit_styles.push(sel);
        });


        if(suit_styles.length==0) {
            progressCallback(1,1);
            callback();
        
        } else {
            // Loop through all sources
            suit_styles.forEach(suit_style=>{
                fetch(suit_style.getAttribute("src")).then(
                    res=>res.text().then(
                        res=>{
                            //console.log("------------ LOADED SUITSTYLE: ", suit_style);
                            suit_style.removeAttribute("src");
                            suit_style.innerHTML = res;
                            //console.log("--------: ", suit_style);

                            finished_load();
                        }
                    )
                )
            });
        }
    },
    loadScripts: (root, progressCallback, callback = () => {}) => {
        let _scripts = [];
        let finished_scripts = 0;


        let finished_load = () => {
            finished_scripts++;
            progressCallback(finished_scripts, _scripts.length);
            if(finished_scripts>=_scripts.length)
                callback();
        }

        // Get all valid sources
        root.querySelectorAll("script[src]").forEach(sel=>{
            if(sel.getAttribute("src")) _scripts.push(sel);
        });


        if(_scripts.length==0) {
            progressCallback(1,1);
            callback();
        }
        else {
            // Loop through all sources
            _scripts.forEach(script=>{
                fetch(script.getAttribute("src")).then(
                    res=>res.text().then(
                        res=>{
                            //console.log(res);
                            //script.parentElement.removeChild(script);
                            //console.log("------------ LOADED SCRIPT: ", script);
                            script.setAttribute("ref-src", script.getAttribute("src"));

                            script.removeAttribute("src");
                            script.innerHTML = res;

                            //root.innerHTML += `<script>` + res + `<\/script>`;

                            finished_load();
                        }
                    )
                )
            });
        }
    }
}

var RouteUtils = {
    sliceUrl: (url) => {
        let protocol_index = url.includes("//") ? url.indexOf("//")+2 : 0;
        let protocol = url.slice(0, protocol_index-2);
        
        let bare = url.slice(protocol_index);
    
        let domain_index = bare.includes("/")?bare.indexOf("/")+1:bare.length;
        let domain = bare.slice(0, domain_index-1);
        let pathf = bare.slice(domain_index);

        let misc_index = bare.includes("?") ? bare.lastIndexOf("?") : bare.length;
        let misc = bare.slice(misc_index+1);


        let fragment_index = misc.indexOf("#");        
        let params = misc.slice(0, fragment_index);
        let fragment = misc.slice(fragment_index+1);

        let bare_nm = bare.slice(0, misc_index);
        let base = bare_nm.includes("/") ? bare_nm.slice(0, 
            bare_nm.lastIndexOf(".")>bare_nm.lastIndexOf("/") ? 
                bare_nm.lastIndexOf("/") + 1 : bare_nm.length) : "./";

        let basef = protocol + "//" + base;

        return {protocol, bare, bare_nm, basef, base, domain, pathf, params, fragment};
    },


    /** Outputs absolute path from a given base to a relative path.
     * 
     * 
     *  For example, `getAbsolutePath('www.sample.com/pages/', '../files/image.png')`
     *  will be evaluated to the absolute path `'www.sample.com/files/image.png'` */
    getAbsolutePath: (base_path, relative_path) => {
        let absolute = base.replace(/(?:\/|\\)$/, "").slice(
            base.includes("//") ? base.indexOf("//") + 2 : 0
        );

        
        let path_segments = absolute.split("/");


        if(relative_path=="/") return path_segments[0];

        if(relative_path.startsWith("../") && path_segments.length>0)
            path_segments.pop();

        return path_segments.join("/");

    }
}


// _statePopped = () => {
//     console.log("Hello world (main)");
// }

// window.onpopstate = function(e) {
//     _statePopped();
//     //console.log("Popped at " + event.composedPath);
// }

//window.addEventListener("DOMContentLoaded", ()=>console.log("Hurrah!"));

// if(document) {
//     console.log("IT EXISTSSSSSSSSS");
//     console.log(document);
// } else {

window.onpopstate = (event) => {
    if(PageRoute._current_route_mode && history.state && history.state.route_mode) {
        if(PageRoute._current_route_mode == "content") 
            PageRoute.toContentRoute(location.href);
        else if(PageRoute._current_route_mode == "page") 
            PageRoute.toPageRoute(location.href);
    }
}



function configureClicks(element) {
    let route_url = element.getAttribute("href");

    if(element.hasAttribute("content-routing")) {
        PageRoute.toContentRoute(route_url, ()=>{}, ()=>{
            PageRoute._current_route_mode = "content";
            history.replaceState({route_mode: "content"}, "");

            history.pushState({route_mode: "content"}, "", route_url);
        });
        
        return false;
    } else if(element.hasAttribute("page-routing")) {
        PageRoute._current_route_mode = "page";
        history.replaceState({route_mode: "page"}, "");


        history.pushState({route_mode: "page"}, "", route_url);
        PageRoute.toPageRoute(route_url);
        return false;
    }

    return true;
}

// document.onclick = (event) => {
//     let element = event.target || e.srcElement;
//     if(element.hasAttribute("href")) {
//         return configureClicks(element);
//     }
// };


window.addEventListener("DOMContentLoaded", ()=>{

    document.querySelectorAll("a[href]").forEach(el=>{
        el.onclick = () => {
            return configureClicks(el);
        };
    });
});

window.addEventListener("DOMNodeInserted", () => {
    document.querySelectorAll("a[href]").forEach(el=>{
        el.onclick = () => {
            return configureClicks(el);
        };
    });
});

// Element.prototype.onclick = () => {
//     alert("HAHA");
//     return false;
// }
// }


//window.addEventListener("DOMContentLoaded", ()=>PageRoute.isWindowReady = true);
window.hasContentHandler = true;

window.hasSleeveContent = true;
history.scrollRestoration = "manual";

document.onsuitload = () => {
    setTimeout(PageRoute.preloadRoutes, 100);
}

// class Route {
    
//     /** url to be displayed. 
//      */
//     url;

//     /** Url of page where content is fetched. This defaults to the url property, wherein
//      *  if is_content_loaded equals false and this route is called,
//      *  the content of given comtent_url is loaded.
//     */
//     content_url;

//     /** true if current route is based on explicit content rather than a whole page */
//     is_content_based = false;
    
//     is_content_loaded = false;
//     content = {};
    
//     constructor(url) {
//         this.url = url;
//         this.content_url = url;
//     }

//     setContent(content) {
//         this.content = content;

//         this.is_content_based = true;
//         this.is_content_loaded = true;
//     }

//     /** Apply route content to current page */
//     apply = () => {
//         if(this.is_content_based) {

//         } else {
//             fetch(this.content_url).then(res=>res.text().then(res=>{
//                 console.log("Page has been loaded!!!");
//                 console.log(res);
//             }));
//         }
//     }

// }