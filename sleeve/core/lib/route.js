
window.isRunnable = true;

window.addEventListener("DOMContentLoaded", ()=>{
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
            src = base + "/" + src;
    
            el.setAttribute("src", src);
        });
        root.querySelectorAll("[href]").forEach(el=>{
            let href = el.getAttribute("href") || el.href;
            href = base + "/" + href;
    
            el.setAttribute("href", href);
        });
}

function processRoute() {

    let route_element = document.querySelector("route[view]");
    if(route_element) {
        // If a route element is found, 
        // this confirms that the page is a route,
        // so we load the view (if there is any)

        let view;
        let preloaded_view_element = document.querySelector("preloaded-route-view");
        if(preloaded_view_element) view = preloaded_view_element.innerHTML;

        let processView = () => {



            let view_url = document.querySelector("route[view]").getAttribute("view");
            let base = RouteUtils.sliceUrl(view_url).base;




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