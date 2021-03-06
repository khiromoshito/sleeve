var Global = {
    /** Stack of routes that contain the documentElement.children */
    routeStack: []
};

var C = (name) => "";

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

        Object.values(ContentHandler._content).map(content=>{
            let temp_content = document.createElement("html");
            temp_content.innerHTML = content;

            
            temp_content.querySelectorAll("script:not([src])").forEach(script_raw=>{
                let script = document.createElement("script");
                script.innerHTML = script_raw.innerHTML;
                Array.prototype.slice.call(script_raw.attributes).forEach(attr=>{
                    script.setAttribute(attr.name, attr.value);
                });
                document.head.appendChild(script);
                script_raw.parentElement.removeChild(script_raw);
            });

            return temp_content.innerHTML;
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

            if(content_value!=null && content_value!==undefined) el.innerHTML = content_value;

            
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
        console.log("Content routing...");
        PageRoute.onRoutingStart(url);
        PageRoute.onRoutingProgress(url, 0.4);

        let route_data = null;


        let processRoute = () => {
            thenState();
            //console.log(res);
            PageRoute.onRoutingProgress(url, 0.8);

            if(history.state)
                history.replaceState({...history.state, route_data: route_data, route_src: url}, "");
            else
            history.replaceState({route_data: route_data, route_src: url}, "");


            let base_url = RouteUtils.sliceUrl(url).basef;
            console.log("--- url: " + url);
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

            window.C = function(name) {
                return contents[name] || "";
            };

            ContentHandler.setContent(contents);


            
            if(window.hasSleeve) Sleeve.initialise();
            if(window.hasSuit) Suit.initialise();
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
                processRoute();
            } else {
                PageRoute._preloading_callbacks[url]
                    = function(res){
                        route_data = res;
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
            thenState();

            console.clear();

            console.log("Page routing...");

            let temp_page = document.createElement("html");
            temp_page.innerHTML = route_data;

            if(history.state)
                history.replaceState({...history.state, route_data: route_data, route_src: url}, "");
            else
            history.replaceState({route_data: route_data, route_src: url}, "");



            

            let updateProgress = (progress) => {
                console.log("---- Loaded " + Math.round(progress) + "%");
                PageRoute.onRoutingProgress(url, progress/100);
            }

            updateProgress(40);

            let writePage = () => {
                document.write(temp_page.innerHTML);
                document.close();
                PageRoute.onRoutingSuccess(url);
            
                callback();
                console.log("DONE!!!");
            }

            let sandbox = document.createElement("iframe");
            sandbox.style.display = "none";
            document.body.appendChild(sandbox);


            let externals = temp_page.querySelectorAll("script[src],suit-style[src],route[view]");
            let ext_parent = document.createElement("html");
            let idcounter = 0;
            
            
            let base = RouteUtils.sliceUrl(location.href).basef;
            
            externals.forEach(el=>{
                el.setAttribute("slexid", (++idcounter)+"");
                

                //console.log("Old source: " + (el.getAttribute("src") || el.getAttribute("view")));

                if(el.hasAttribute("src")) 
                    el.setAttribute("src", RouteUtils.getAbsolutePath(base, el.getAttribute("src")));
                else if(el.hasAttribute("view")) 
                    el.setAttribute("view", RouteUtils.getAbsolutePath(base, el.getAttribute("view")));
                

                ext_parent.appendChild(el.cloneNode(true));

                //console.log("New source: " + (el.getAttribute("src") || el.getAttribute("view")));
            });

            console.log(location.href);
            console.log(base);

            let injectHTML = `<base href="`+base+`"></base><script>
                var ResourceLoader;
                var updateProgress;
                var returnResources;

                function loadResources() {
                    console.log(location.href);
                    ResourceLoader.loadRouteView(document, ()=>{}, ()=>{
                    console.log("---- Loaded 60%");

                    ResourceLoader.loadSuitStyles(document, (i, t)=>{
                            updateProgress(((i/t)*20)+60);
                        }, 
                        ()=>{
                            ResourceLoader.loadScripts(document, (i, t)=>{
                                updateProgress(((i/t)*20)+80);
                            }, 
                            ()=>{
                                setTimeout(()=>{
                                    returnResources();
                                }, 100);
                            });
                        });
                    });
                }
            <\/script>`;

            sandbox.contentDocument.write(injectHTML);
            sandbox.contentDocument.documentElement.innerHTML += ext_parent.innerHTML;
            
            sandbox.contentWindow.ResourceLoader = ResourceLoader;
            sandbox.contentWindow.updateProgress = updateProgress;
            sandbox.contentWindow.returnResources = () => {
                //console.log("Resources are now ready to be returned");
                sandbox.contentDocument.querySelectorAll("[slexid]").forEach(
                    el=>{
                        //console.log(el);
                        const slexid = el.getAttribute("slexid");
                        el.removeAttribute("slexid");
                        let unloaded = temp_page.querySelector("[slexid='"+slexid+"']");
                        
                        unloaded.parentElement.replaceChild(el.cloneNode(true), unloaded);
                        //writePage();
                    }
                );

                let preloaded_view = sandbox.contentDocument.querySelector("[preloaded-route-view]");
                if(preloaded_view) {
                    console.log(preloaded_view);
                    // preloaded_view.style.display = "none";
                    temp_page.appendChild(preloaded_view);
                }
                // writePage();

                //console.log(temp_page);
                writePage();
            };
            sandbox.contentWindow.loadResources();

            // ResourceLoader.loadRouteView(temp_page, ()=>{}, ()=>{
            //     console.log("---- Loaded 60%");

            //     ResourceLoader.loadSuitStyles(temp_page, (i, t)=>{
            //             updateProgress(((i/t)*20)+60);
            //         }, 
            //         ()=>{
            //             ResourceLoader.loadScripts(temp_page, (i, t)=>{
            //                 updateProgress(((i/t)*20)+80);
            //             }, 
            //             ()=>{
            //                 setTimeout(()=>{
            //                     writePage();
            //                 }, 100);
                            
            //             });
            //     });
            // });

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

        

        let page_routing_elements = document.querySelectorAll("[page-routing][href][preloaded]");
        let content_routing_elements = document.querySelectorAll("[content-routing][href][preloaded]");

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
            //console.log("Route view: " + view_src);
            fetch(view_src).then(
                res=>res.text().then(res=>{
                    //console.log("------------ LOADED ROUTEVIEW: ", route_element);
                    let injectPreload = `<script preloaded-route-view>var preloaded_route_view = \``+res.replace(/\<\//g, "<\\/")+`\`;<\/script>`;
                    //(injectPreload);
                    route_element.insertAdjacentHTML("afterend", injectPreload);
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
                //console.log("Suit style: " + suit_style.getAttribute("src"));
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
                //console.log("Script: " + script.getAttribute("src"));
                fetch(script.getAttribute("src")).then(
                    res=>res.text().then(
                        res=>{
                            //console.log(res);
                            //script.parentElement.removeChild(script);
                            //console.log("------------ LOADED SCRIPT: ", script);
                            script.setAttribute("ref-src", script.getAttribute("src"));

                            script.removeAttribute("src");
                            script.innerHTML = res;


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
        let protocol_index = url.includes("://") ? url.indexOf("://")+3 : 0;
        let protocol = url.slice(0, protocol_index!=0 ? protocol_index : 0);

        
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

        let basef = protocol + base;

        console.log({basef});

        return {protocol, bare, bare_nm, basef, base, domain, pathf, params, fragment};
    },


    /** Outputs absolute path from a given base to a relative path.
     * 
     * 
     *  For example, `getAbsolutePath('www.sample.com/pages/', '../files/image.png')`
     *  will be evaluated to the absolute path `'www.sample.com/files/image.png'` */
    getAbsolutePath: (base, relative_path) => {
        // The base path must be complete in format-- protocol://domain/[path]/
        let start_index = base.indexOf("://")+3;
        if(relative_path.includes("://")) return relative_path;
        
        
        let path_segments = base.slice(start_index).split("/").filter(s=>s.trim()!="");


        relative_path = relative_path.trim();
        if(relative_path.startsWith("/")) {
            path_segments = [path_segments[0]];
            relative_path = relative_path.slice(1);
        } else if(relative_path.startsWith("../") && path_segments.length>0) {
            if(path_segments.length>1) path_segments.pop();
            relative_path = relative_path.slice(3);
        } else if(relative_path.startsWith("./")) {
            relative_path = relative_path.slice(2);
        }

        return base.slice(0, start_index) + path_segments.join("/") + "/" + relative_path;

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
    if(history.state && history.state.route_mode) {
        if(history.state.route_mode == "content") {
            PageRoute.toContentRoute(location.href);
        }
        else if(history.state.route_mode == "page") { 
            PageRoute.toPageRoute(location.href);
        }
    }
}



function configureClicks(element) {
    let route_url = element.getAttribute("href");

    if(element.hasAttribute("content-routing")) {

        let closest_sidebar = element.closest(".su-sidebar[visible]");
        if(closest_sidebar && closest_sidebar.hasAttribute("visible")) sidebar(closest_sidebar, false);
        
        PageRoute.toContentRoute(route_url, ()=>{}, ()=>{
            PageRoute._current_route_mode = "content";
            if(!history.state) 
                history.replaceState({route_mode: "content", ...history.state}, "");

            history.pushState({route_mode: "content"}, "", route_url);
        });


        return false;
    } else if(element.hasAttribute("page-routing")) {

        let closest_sidebar = element.closest(".su-sidebar[visible]");
        if(closest_sidebar && closest_sidebar.hasAttribute("visible")) sidebar(closest_sidebar, false);
        
        

        PageRoute.toPageRoute(route_url, ()=>{}, ()=>{
            PageRoute._current_route_mode = "page";
            
            if(!history.state || !history.state.route_mode) 
                history.replaceState({route_mode: "content"}, "");

            history.pushState({route_mode: "page"}, "", route_url);
        });


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