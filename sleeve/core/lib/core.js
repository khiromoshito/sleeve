

/** Picks an element (first match) by a CSS selector */
var E = (selector) => document.querySelector(selector);

/** Picks all matching elements by a CSS selector */
var Es = (selector) => document.querySelectorAll(selector);

var Sleeve = {
    initialise: (root = document, callback = () => {}) => {

        console.time("Snippets load time");
        Sleeve.loadSnippets(root, ()=>{
            console.timeEnd("Snippets load time");
            Sleeve.update(true, root);
            Sleeve.onPrepared();
            Sleeve.isPrepared = true;
            callback();
        });

        // window.addEventListener("DOMNodeInserted", () => {
        //     Sleeve.update();
        // });
    },

    isPrepared: false,
    onPrepared: () => {},

    updateZeroCounter: 0,

    update: (isInitial = false, root = document) => {
        console.log("\n\n\n\n\nUpdating sleeve...");
        console.time("Sleeve update time");


        if(window.hasContentHandler) ContentHandler.displayAll();
        if(window.hasSleeveIterate) Sleeve.scanIteratingElements(root);

        if(window.hasSleeveAbstract) {
            Sleeve.scanAbstractElements(root);
            Sleeve.parseAbstractModels();
        
            SleeveDOM.parseAbstractInstances(root.body || root);
        }


        Sleeve.replicateReferencedElements(root);
        
        if(window.hasSleeveDynamic) Sleeve.scanDynamicElements(root);


        console.timeEnd("Sleeve update time");
    },

    loadSnippets: (root = document, callback) => {

        let snippet_elements = SleeveUtils.toArray(root.querySelectorAll("snippet"));
        
        
        let counter = snippet_elements.length;

        let finished = () => {
            counter--;
            if(counter<=0) callback();
        };
        
        for(let el of snippet_elements) {
            if(el.hasAttribute("src")) {
                let snippet_src = el.getAttribute("src");
                let content = SleeveAPI.fetchText(snippet_src, (content) => {


                    SleeveUtils.toArray(el.attributes).forEach(attr=>{
                        if(attr.name.startsWith("value-")) {
                            let value_name = attr.name.slice(6);
                            let value = attr.value;

                            content = content.replaceAll("%"+value_name+"%", value);
                        }
                    });

                    let content_node = SleeveDOM.wrapAll(SleeveDOM.stringToNodeList(content));

                    let parsed = false;

                    if(el.hasAttribute("snip-id")) {
                        let id = el.getAttribute("snip-id");
                        let picked_node = content_node.querySelector(`[id='${id}'`);
                        content_node.innerHTML = "";
                        content_node.appendChild(picked_node);
                    } else if(el.hasAttribute("selector")) {
                        let selector = el.getAttribute("selector");
                        let picked_nodes = content_node.querySelectorAll(selector);
                        content_node.innerHTML = "";
                        picked_nodes.forEach(pn=>content_node.appendChild(pn));
                    }




                
                
                
                
                    el.innerHTML = content_node.innerHTML;
                    Sleeve.loadSnippets(el, ()=>{
                        Sleeve.cleanSnippets(root);
                        finished();
                    });
                });
                //console.log("Loaded snippet: ", node);
            
            }
        }

        if(counter==0) callback();

    },

    cleanSnippets: (root) => {
        let junk_snippets = document.querySelectorAll("snippet");
        junk_snippets.forEach(snippet=>{
            let snippet_content = snippet.innerHTML;
            snippet.insertAdjacentHTML("afterend", snippet_content);
            snippet.parentNode.removeChild(snippet);
        });
    },

    log: (message) => {
        console.log(message);
    },

    idcounter: 0,

    _value_elements: {},
    _reference_elements: {},
    _abstract_elements: {},
    _dynamic_elements: {},
    _special_attributes: ["rid", "abstract", "model", "dynamic", "ref-id", "ref-only"],
    

    scanDynamicElements: (root = document) => {
        let dynamic_elements = root.querySelectorAll("[dynamic]");

        dynamic_elements.forEach(el=>{
            let dynamic_element = new DynamicElement(el);
            Sleeve._dynamic_elements[dynamic_element.id] = dynamic_element;
        });
    },

    scanAbstractElements: (root = document) => {
        let abstract_elements = root.querySelectorAll("[abstract]");

        abstract_elements.forEach(el=>{
            let abstract_element = new AbstractElement(el);
            Sleeve._abstract_elements[abstract_element.tagName] = abstract_element;
        });
    },

    parseAbstractModels: () => {
        Object.values(Sleeve._abstract_elements).forEach(abstract_element=>{
            let model = abstract_element.model_element;

            Sleeve.parseInnerAbstractInstance(model);


        });

    },

    parseInnerAbstractInstance: (root) => {

        let abstract_tagnames = 
            Object.keys(Sleeve._abstract_elements).join(",").toLowerCase();

        let inner_abstract_instances = root.querySelectorAll(abstract_tagnames);

        inner_abstract_instances.forEach(instance => {
            let instance_abstract = Sleeve._abstract_elements[instance.tagName];
            instance.innerHTML = "";
            instance.appendChild(instance_abstract.model_element.cloneNode(true));

            Sleeve.parseInnerAbstractInstance(instance);
        });
    },

    setupAbstractModels: () => {
        Object.values(Sleeve._abstract_elements).forEach(abstract_element=>abstract_element.setupModel());
    },


    scanIteratingElements: (root = document) => {
        let iterating_elements = root.querySelectorAll("[iterating]");
        iterating_elements.forEach(el=>{
            let iterating_element = new IteratingElement(el);
            iterating_element.iterate();
        });
    },


    replicateReferencedElements: (root = document) => {
        let referenced_elements = root.querySelectorAll("[ref-id]");
        referenced_elements.forEach(el=>{
            let reference = root.getElementById(el.getAttribute("ref-id"));
            if(reference) {
                let reference_attributes = SleeveUtils.toArray(reference.attributes);
                let replicatable_attributes = null;


                if(el.hasAttribute("ref-only")) {
                    let attr_criteria = el.getAttribute("ref-only");

                    if(attr_criteria.trim().length>0) 
                        replicatable_attributes = attr_criteria.split(",").map(a=>a.trim());
                }

                reference_attributes.forEach(attr=>{
                    if(!Sleeve._special_attributes.concat("id").includes(attr.name)
                        && !el.hasAttribute(attr.name)) {

                            if(!replicatable_attributes || 
                                replicatable_attributes.includes(attr.name))
                                
                                el.setAttribute(attr.name, attr.value);

                        }
                });
            }

            el.removeAttribute("ref-id");
            el.removeAttribute("ref-only");
        });
    },


    registerEventListeners: (node = document) => {
        const event_list = ["abort","afterprint","animationend","animationiteration","animationstart","beforeprint","beforeunload","blur","canplay","canplaythrough","change","click","contextmenu","copy","cut","dblclick","drag","dragend","dragenter","dragleave","dragover","dragstart","drop","durationchange","ended","error","focus","focusin","focusout","fullscreenchange","fullscreenerror","hashchange","input","invalid","keydown","keypress","keyup","load","loadeddata","loadedmetadata","loadstart","message","mousedown","mouseenter","mouseleave","mousemove","mouseover","mouseout","mouseup","wheel","offline","online","open","pagehide","pageshow","paste","pause","play","playing","progress","ratechange","resize","reset","scroll","search","seeked","seeking","select","show","stalled","submit","suspend","timeupdate","toggle","touchcancel","touchend","touchmove","touchstart","transitionend","unload","volumechange","waiting","wheel"];
        const event_list_string = event_list.join("],[");

        let listening_elements = node.querySelectorAll(`[${event_list_string}]`);
        console.log(listening_elements);
    },


    throw: (message) => {
        let error = new Error(message);
        error.stack = "Sleeve"+message;
        throw error;
    }

}

window.hasSleeve = true;


var SleeveDOM = {
    getValueElementById: (id) => {
        let found_element = document.querySelector("#"+id);
        if(found_element==null) return null;

        let rid = found_element.getAttribute("rid");
        if(rid==null) return null;

        let value_element = Sleeve._value_elements[rid];
        if(!value_element) return null; else return value_element;
    },

    nodeToString: (node) => {
        let temp_parent = document.createElement("div");
        temp_parent.appendChild(node.cloneNode(true));
        return temp_parent.innerHTML;
    },

    stringToNode: (nodestring) => {
        let temp_parent = document.createElement("div");
        temp_parent.innerHTML = nodestring;
        return temp_parent.firstChild;
    },

    stringToNodeList: (nodestring) => {
        let temp_parent = document.createElement("div");
        temp_parent.innerHTML = nodestring;
        return temp_parent.childNodes;
    },

    wrapAll: (nodes, parent = "div") => {
        let parent_node = document.createElement(parent);
        nodes.forEach(n=>parent_node.appendChild(n.cloneNode(true)));
        return parent_node;
    },
    

    parseAbstractInstances: (node, values = []) => {

        if(!document.body.contains(node)) return false;

        //console.log("\n\n\nParsing node "+node.tagName+"...");

        let abstract_tagnames = 
            Object.keys(Sleeve._abstract_elements).join(",").toLowerCase();


        if(abstract_tagnames.length>0) node.querySelectorAll(abstract_tagnames).forEach(el=>{
            
            let abstract_element = Sleeve._abstract_elements[el.tagName];

            let target_element = abstract_element.model_element.cloneNode(true);

            let value_attributes = [...values];
            SleeveUtils.toArray(el.attributes).forEach(attr=>{
                if(!Sleeve._special_attributes.includes(attr.name)
                    && !target_element.hasAttribute(attr.name)) {

                        //console.log(attr.name);
                        if(attr.name.startsWith("value-"))
                            value_attributes.push([attr.name.slice(6), attr.value]);
                        else
                            target_element.setAttribute(attr.name, attr.value);

                            
                            //this.reference_element.removeAttribute(attr.name);
                        
                }
            });

            let target_element_string = SleeveDOM.nodeToString(target_element);
            value_attributes.forEach(attr=>{
                target_element_string =  
                        target_element_string.replaceAll(
                            "%" + attr[0] + "%", attr[1]);
            });
            
            
            el.innerHTML = target_element_string;

            SleeveDOM.parseAbstractInstances(el, value_attributes);
            // console.log("Found abstract instance");
            // let abstract_instance = new AbstractInstanceElement(el);
            // Sleeve._abstract_elements[el.tagName].instances_unparsed.push(abstract_instance);

            // SleeveDOM.parseAbstractInstances(el);
        });

        return node;

    },

    parseLiteralNode: (node) => {
        console.log("Parsing node...");
        let node_string = SleeveDOM.nodeToString(node);
        node_string = node_string.replace(/\{[a-zA-Z_]+[a-zA-Z_0-9]*\}/g, m=>{
            let found_var = m.slice(1,-1);
            let found_value = window[found_var];

            if(found_value) {
                let value_is_state = found_value.isState;   
                console.log("--- Found a variable: " + found_var);
                console.log("    isState: " + value_is_state);
                console.log("    value: " + found_value);

                if(value_is_state) return found_value.value; 
                    else return found_value;
            }
            return m;
        });

        console.log("--- Literal parse completed.");
        console.log("--- " + node_string);
        
        let node_again = SleeveDOM.stringToNode(node_string);
        return node_again;
    },
}

var SleeveUtils = {
    /** Converts nodelist into array */
    toArray: (nodelist) => Array.prototype.slice.call(nodelist)
}

var SleeveAPI = {
    fetchText: (url, callback) => {
        fetch(url).then(res=>res.text().then(res=>{
            callback(res);
        }));
    }

}


/** This holds a value, that when changed, 
 *  updates html elements that hold it (called listeners) */

function State(value, listeners = []) {
    this.isState = true;
    
    this.value = value;
    this.listeners = listeners;

    this.update = (value, listeners = []) => {
        this.value = value;
        this.broadcast();
    };

    this.broadcast = () => {
        this.listeners.forEach(listener=>listener.update());
    };

    this.addListener = (listenerId) => {
        //console.log("(STATE): Added listener");
        this.listeners.push(listenerId);
    };

    this.toString = () => this.value;
}

window.addEventListener('DOMContentLoaded', ()=>{
    console.log("Starting...");
    Sleeve.initialise();
});

String.prototype.replaceAll = function(match, value) { return this.split(match).join(value)};