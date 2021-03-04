
window.isRunnable = true;

window.addEventListener("load", ()=>{
    //console.log("Hurrah! ContentHandler is now ready!");

    // As support to Sleeve-content's route loading, 
    // this route will first check for any pre-loaded views
    // inside a <preloaded-route-view> element
    
    relocatePaths();
    processRoute();
});

function relocatePaths(root = document, base = RouteUtils.sliceUrl(location.href).basef) {
    base = base.replace(/\/$/, "");
        console.log(base);
        root.querySelectorAll("[src]").forEach(el=>{
            let src = el.getAttribute("src") || el.src;
            src = RouteUtils.getAbsolutePath(base, src);
    
            el.setAttribute("src", src);
        });
        root.querySelectorAll("[href]").forEach(el=>{
            let href = el.getAttribute("href") || el.href;
            href = RouteUtils.getAbsolutePath(base, href);
    
            el.setAttribute("href", href);
        });
}

function processRoute() {

    console.clear();

    let route_element = document.querySelector("route[view]");
    if(route_element) {
        // If a route element is found, 
        // this confirms that the page is a route,
        // so we load the view (if there is any)

        let view;
        
        if(window.preloaded_route_view) {
            view = window.preloaded_route_view;
        } else {
        
            let preloaded_view_element = document.querySelector("preloaded-route-view");
            if(preloaded_view_element) view = preloaded_view_element.innerHTML;
        }
        

        let processView = () => {
            let view_url = document.querySelector("route[view]").getAttribute("view");
            let base = RouteUtils.sliceUrl(view_url).basef;


            //console.log("Loaded! ", res);
            let temp = document.createElement("html");
            temp.innerHTML = `<base href="`+base+`"></base>` + view;


            //list through all content values [[name, value]]
            let contents = [];
            
            let content_elements = document.querySelectorAll("content");
            content_elements.forEach(el=>{
                if(el.hasAttribute("name")) {
                    contents.push([
                        el.getAttribute("name"),
                        el.innerHTML
                    ]);
                }
            });

            contents.forEach(cv=>{
                temp.querySelectorAll("[content='"+cv[0]+"']").forEach(el=>{
                    el.innerHTML = cv[1];
                });
            }); 

            console.log(temp.innerHTML);
            document.write(temp.innerHTML);
            document.close();

            
            
            // console.log(document.documentElement);
            // console.log(document.querySelectorAll("dropdown"));
        }


        if(view) processView();
        else {
            let view_url = route_element.getAttribute("view");
            if(!view_url) return false;

            fetch(view_url)
            .then(res=>res.text()
            .then(res=>{
                view = res;
                // `<script>
                //     history.replaceState({route_mode: "content"}, "");
                //     window.isWindow = true;
                //     window._loading_event_listeners = [];
                //     window._other_event_listeners = {};
                //     EventTarget.prototype._addEventListener = EventTarget.prototype.addEventListener;
                //     EventTarget.prototype.addEventListener = function(type, listener) {
                //         if(this.isWindow) {
                //             if((type=="DOMContentLoaded" || type=="load")) {
                //                 //console.log("Added a listener of type '" + type + "'", listener);
                //                 window._loading_event_listeners.push(listener);
                //             } else {
                //                 if(!window._other_event_listeners[type])
                //                     window._other_event_listeners[type] = [];
                //                 window._other_event_listeners[type].push(listener);
                //             }
                //         }
                //     }
    
                
                // <\/script>` + res +
                
                // `<script>
                //     window._loading_event_listeners.forEach(l=>{
                //         l();
                //     });
                //     Object.keys(window._other_event_listeners).forEach(lt=>{
                //         let listeners = window._other_event_listeners[lt];
                //         //let listeners_call = listeners.join("(); ") + "();";
                        
                //         window["on"+lt] = function() {
                //             listeners.forEach(l=>{
                //                 //console.log(l);
                //                 l();
                //             });
                //         }
                //     });
                //     document.close();
                // <\/script>`;
                processView();
            }).catch(e=>console.log("Error loading view: " + e)))
            .catch(e=>console.log("Error processing view: " + e));
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