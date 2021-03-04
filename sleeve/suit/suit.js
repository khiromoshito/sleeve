
function R(mobile, tablet, desktop) {
    return Theme.evaluateResponsiveValue(
        {mobile: mobile,
        tablet: tablet,
        desktop: desktop});
}

var Suit = {

    idcounter: 0,

    initialise: function() {

        //document.head.innerHTML += "<style>body,.doNotModifyThis {display: none;}";
        //Suit.showLoader();

        
        console.time("sleeve-suit load time");
        console.log("Initialising sleeve-suit");

        let viewport_meta = document.querySelector("meta[name='viewport']");
        if(!viewport_meta) 
            document.head.innerHTML += `<meta name="viewport" 
                content="width=device-width">`;
        else if(viewport_meta.getAttribute("content"))
            viewport_meta.setAttribute("content", "width=device-width");
        else if(!viewport_meta.getAttribute("content").includes("width="))
            viewport_meta.setAttribute("content", 
                viewport_meta.getAttribute("content") + ";width=device-width");

        Theme.updateScale(false);


        Suit.loadResponsiveElements();
        Suit.loadSemantics();

        Suit.loadSuitStyles();
        //Suit.loadInlineStyles();
        



        if(!Suit.had_external) Suit.concludeInit();

        console.timeEnd("sleeve-suit load time");
        console.log("\n\n");

        //document.body.style.display = "initial";
    },

    _loader: null,

    showLoader: () => {
        let loader_element = document.querySelector("loader");
        if(loader_element) {
            Suit._loader = loader_element.cloneNode(true);
            document.documentElement.appendChild(Suit._loader);
            Suit._loader.style.display = "block";
        }
    },

    collapseLoader: () => {
        if(Suit._loader) {
            Suit._loader.parentElement.removeChild(Suit._loader);
        }
    },

    concludeInit: () => {

        Suit.had_external = false;
        Theme.updateScale(true);
        IconsLoader.loadIconDependencies();
        Suit.showPage();

        Suit.fixBlockCodes();

        // window.addEventListener("DOMNodeInserted", () => {
        //     Sleeve.update();
        // });

        if(document.onsuitload) document.onsuitload();
        // console.log("loadListener: ", document.onsuitload);
        // console.log("self: ", document);
        // console.log("owner: ", document.ownerDocument);
    },

    _suitstyles: [],
    _inline_styled_elements: [],
    _responsive_elements: [],
    had_external: false,
    waiting: 0,

    // [    tagName,           modelTagName,        modelClass,     optional_attr,    actions]
    _semantics: [
        ["block-code",            "div",       "su-code-block",         null,         (el)=>{
            if(window.hasCodeFormatter) {
                //console.log("Hurrah!");

                el.innerHTML = CodeFormatter.format(el.getAttribute("mode") 
                    || "", el.innerHTML.trim());
            }
                
        
        }],
        ["code",            "span",       "su-code",         null,         (el)=>{
            if(window.hasCodeFormatter) {
                //console.log("Hurrah!");

                el.innerHTML = CodeFormatter.format(el.getAttribute("mode") 
                    || "", el.innerHTML.trim());
            }
                
        
        }],
        ["vspace",           "div",      "su-space",      null,     (el)=>{
            console.log(el);
            let thickness = el.getAttribute("thickness") || 0;
            el.style.height = Number(thickness) ? thickness + "px" : thickness;
            el.removeAttribute("thickness");
        }],


        ["scaffold",         "div",      "su-body"],
        ["navbar",           "div",      "su-navbar", null, (el)=>{
            let height_string = el.getAttribute("height").trim() || "50px";
            let height_num = parseFloat(height_string);
            
            if(height_string.endsWith("%")) {
                height_num = (height_num/100)*document.documentElement.clientHeight;
            }

            Theme.sizes.navbar = height_num;
            el.removeAttribute("height");
        }],
        ["nav-left",         "div",      "su-navbar-left"],
        ["nav-center",       "div",      "su-navbar-center"],
        ["nav-right",        "div",      "su-navbar-right"],
        ["nav-links",        "div",      "su-navbar-links", null, (el)=>{
            let gaps = el.getAttribute("gaps") || "0px";
            let links = Array.prototype.slice.call(el.children);
            links.shift();
            links.forEach(l=>l.style.marginLeft = gaps);

            el.removeAttribute("gaps");
        }],
        ["main",             "div",      "su-main"],
        ["sidebar",          "div",      "su-sidebar", null, (el)=>{
            let width_string = el.getAttribute("width").trim() || "300px";
            let width_num = parseFloat(width_string);
            
            if(width_string.endsWith("%")) {
                width_num = (width_num/100)*document.documentElement.clientWidth;
            }

            Theme.sizes.sidebar = width_num;
            el.removeAttribute("width");
        }],
        ["sidebar-toggle",   "div",      "su-sidebar-togglebtn", null, el=>{
            el.setAttribute("onclick", "sidebar(this)");
            if(el.hasAttribute("auto-appear")) {
                const oldcallack = document.onsuitload;
                if(!document.querySelector(".su-body") ||
                    !document.querySelector(".su-sidebar"))
                    el.style.display = "none";    
                el.setAttribute("device", "mobile, tablet");
                el.removeAttribute("auto-appear");
            }
        }],
        
        ["blockbtn",         "button",      "su-btn-block"],


        ["dropdown",         "div",      "su-dropdown"],
        ["dropdown-button",  "div",      "su-dropdown-btn",   ["onclick", "dropdown(this)"]],
        ["dropdown-items",   "div",      "su-dropdown-items"],
        ["dropdown-icon",    "div",      "su-dropdown-icon"],

        ["tabs",             "div",      "su-tabs",     null,      (el)=>{
            let default_index = Number(el.getAttribute("default") || 0);
            let tab_buttons = el.querySelector("tab-buttons, .su-tab-buttons");
            let tab_pages = el.querySelector("tab-pages, .su-tab-pages");

            if(tab_buttons && tab_pages) {
                if(tab_buttons.children[default_index])
                    tab_buttons.children[default_index]
                        .setAttributeNode(document.createAttribute("tab-selected"));                            

                if(tab_pages.children[default_index])
                    tab_pages.children[default_index]
                        .setAttributeNode(document.createAttribute("tab-selected"));
            }
            
        }],
        ["tab-buttons",      "div",     "su-tab-buttons", null, (el)=>{
            Array.prototype.slice.call(el.children).forEach(btn=> {
                if(!btn.hasAttribute("onclick"))
                    btn.setAttribute("onclick", "tab(this)");
            });
        }],
        ["tab-pages",        "div",     "su-tab-pages"]
    ],


    loadSemantics: (root = document) => {
        console.time("Semantics parse time");
        Suit._semantics.forEach(semantic => {

            let tagName = semantic[0];
            let model_tagName = semantic[1];
            let model_class = semantic[2];
            let optional_attr = semantic[3];

            let semantic_elements = root.querySelectorAll(tagName);

            semantic_elements.forEach(el=>{
                let new_element = document.createElement(model_tagName);


                if(semantic[4]) semantic[4](el);

                let final_class = model_class;
                
                if(el.hasAttribute("type")) {
                    final_class += " " + final_class + "-" + el.getAttribute("type");
                }
                
                Array.prototype.slice.call(el.attributes).forEach(attr=>{
                    console.log(attr.name);
                    if(attr.name=="class")
                        new_element.setAttribute("class", attr.value + " " + final_class);
                    else 
                        new_element.setAttribute(attr.name, attr.value);
                });

                if(!new_element.hasAttribute("class"))
                    new_element.setAttribute("class", final_class);

                if(optional_attr && !new_element.hasAttribute(optional_attr[0]))
                    new_element.setAttribute(optional_attr[0], optional_attr[1]);



                new_element.removeAttribute("type");
                
                new_element.innerHTML = el.innerHTML;

                el.parentElement.replaceChild(new_element, el);
            });
        });

        console.timeEnd("Semantics parse time");
    },

    loadSuitStyles: () => {
        let suitstyles = document.querySelectorAll("suit-style");

        let isDone = false;
        
     
        let finishedExternalLoad = () => {
            Suit.waiting--;
            if(isDone && Suit.waiting<=0)
                Suit.concludeInit();
        }
     
        suitstyles.forEach(ss=>{
            
            if(ss.hasAttribute("src")) {
                Suit.had_external = true;
                Suit.waiting++;
                Suit.loadExternalSuitStyle(ss.getAttribute("src"), content => {


                    //console.log(content);
                    let suitstyle = new SuitStyle(content);
                    Suit._suitstyles.push(suitstyle);

                    //console.log(ss);

                    if(ss.parentElement) ss.parentElement.removeChild(ss);
                    finishedExternalLoad();

                });
            } else {
                
                let suitstyle = new SuitStyle(ss.innerText);
                Suit._suitstyles.push(suitstyle);


                ss.parentElement.removeChild(ss);
            }
        });

        isDone = true;

    },

    loadResponsiveElements: () => {
        let responsive_elements = document.querySelectorAll("[responsive]");
        responsive_elements.forEach(el=>{
            let responsive_element = new ResponsiveElement(el);
            Suit._responsive_elements.push(responsive_element);
        });
    },

    loadInlineStyles: () => {
        let inlines = document.querySelectorAll("[su-style]");
        inlines.forEach(el=>{
            let _inline_styled_element = new InlineStyledElement(el);
            Suit._inline_styled_elements.push(_inline_styled_element);
            _inline_styled_element.parseStyle();
        });

    },


    loadExternalSuitStyle: (src, callback = (res) => {}) => {
        // let request = await fetch(src);
        // let requestText = await request.text();
        // callback(requestText);
        // return requestText;
        fetch(src).then(res=>res.text().then(res=>callback(res)));
        
    },


    updateStyles: () => {
        Suit._suitstyles.forEach(suitstyle=>suitstyle.parse());   
        Suit._responsive_elements.forEach(responsive=>responsive.parse());   

        Suit.updateScreenElements();

        Suit.fixBlockCodes();
        //Suit._inline_styled_elements.forEach(inline=>inline.parseStyle());   
    },

    updateScreenElements: () => {
        document.querySelectorAll("[screens]").forEach(el=>{
            let screens = el.getAttribute("screens").split(",").map(s=>s.toLowerCase().trim());
            el.style.display = (screens.includes(Device.stringOf(Theme.device))) ? 
                "initial" : "none";
        });
    },

    fixBlockCodes: (root = document) => {
        root.querySelectorAll(".su-code-block").forEach(el=>{
            let parent = el.parentElement;
            let parent_style = window.getComputedStyle(parent, null);

           
            //let parent_width = parent.clientWidth;
            let parent_offset = document.documentElement.scrollWidth
                - parent.getBoundingClientRect().width;
            let parent_padding_left = parseFloat(parent_style.getPropertyValue("padding-left"));
            let parent_padding_right = parseFloat(parent_style.getPropertyValue("padding-right"));

            //let parent_space = parent_width - (parent_padding_left + parent_padding_right);

            let parent_bounds = parent_offset + parent_padding_left + parent_padding_right;


            let el_style = window.getComputedStyle(el, null);
            let el_margin = parseFloat(el_style.getPropertyValue("margin-left")) + 
                parseFloat(el_style.getPropertyValue("margin-right"));
            let el_border = parseFloat(el_style.getPropertyValue("border-left-width")) + 
                parseFloat(el_style.getPropertyValue("border-right-width"));
            let el_padding = parseFloat(el_style.getPropertyValue("padding-left")) + 
                parseFloat(el_style.getPropertyValue("padding-right"));

            let el_offset = el_margin + el_border + el_padding;


            el.style.width = document.documentElement.clientWidth - (parent_bounds + el_offset);
        });
    },

    showPage: () => {

        let sheets = document.styleSheets;
        for(let i=0; i<sheets.length; i++) {
            let classes = sheets[i].rules || sheets[i].cssRules;

            for (let j = 0; j < classes.length; j++) {
                if(classes[j]) {
                    if (classes[j].selectorText=="body, .doNotModifyThis") {
                        classes[j].style.cssText = "display: block";
                    }         
                }
            }
        }


        
    }

}

if(window.suit_styles && window.suit_styles[0]) {
    window.suit_styles.forEach(url=>{
        Suit.loadExternalSuitStyle(url, content => {
            let suitstyle = new SuitStyle(content);
            Suit._suitstyles.push(suitstyle);
        });
        
    });
}

var SuitUtils = {
    nodeToString: (node) => {
        let temp_parent = document.createElement("div");
        temp_parent.appendChild(node.cloneNode(true));
        return temp_parent.innerHTML;
    },

    stringToNode: (nodestring) => {
        let temp_parent = document.createElement("div");
        temp_parent.innerHTML = nodestring;
        return temp_parent.firstChild;
    }
}

function SuitStyle(content) {

    this.id = ++Suit.idcounter;
    this.reference_content = content.trim();

    this.parse = () => {
        //console.time("SuitStyle parse time");

        let values = {};

        let style_content = this.reference_content.trim();
        

        //Remove comments
        style_content = style_content.replace(/\/\*([^\*]|\*(?!\/))*\*\//g, "");
        
        
        // Evaluating global variables
        style_content = style_content.replace(/\$\{([^\}]|(?<=\\)\})*\}/g, m=>eval(m.slice(2,-1)));
        
        
        // Fetching all values
        let values_class = "";
        style_content = style_content.replace(/(?:\@\s*values\s*\{)([^\}]*)\}/, m=>{
            values_class = m.slice(m.indexOf("{")+1, m.lastIndexOf("}"));
            return "";
        });



        let values_list = values_class.split(";");
        values_list.forEach(v=>{
            let v_split = v.split(":");
            if(v_split.length==2)
                values[v_split[0].trim()] = v_split[1].trim();
        });


        // Evaluating values
        Object.keys(values).forEach(name=>{
            style_content = style_content.replace(new RegExp("\\$"+name, "g"), values[name]);

        });


        


        // Split sheet into rules
        let rules = [];
        //style_content.replace(/(?:\s*(?:[\.\#]?[\w_]+[\w\d\-_]*)|\*)+\s*\{[^}]*\}/g, m=>{
        
        let rules_raw = style_content.split(";;");



        for(let rule of rules_raw) {
            rule = rule.trim();

            if(rule.length>0 && !rule.startsWith("@")) {
                let rule_s = rule.indexOf("{");
                
                let rule_selector = rule.slice(0, rule_s).trim();

                let rule_values = rule.slice(rule_s+1, rule.lastIndexOf("}"))
                    .trim().replaceAll("\n", "").replaceAll("  ", "");
                
                rules.push([rule_selector, rule_values]);
            }
        }


        //console.log("Rules: ", rules);

        let node_id = `suitstyle-${this.id}`;

        let anchor_node = document.querySelector(`[id='${node_id}']`);
        
        let new_anchor_node = document.createElement("style");
        new_anchor_node.id = node_id;
        
        document.head.appendChild(new_anchor_node);
        if(anchor_node) anchor_node.parentElement.removeChild(anchor_node);
        
        // Find corresponding stylesheet
        let stylesheet;

        for(let ss of document.styleSheets)
            if(ss.ownerNode && ss.ownerNode.id==node_id)
                stylesheet = ss;

        //console.log("Stylesheet: ", stylesheet);

        if(stylesheet) {
            rules.forEach(rule=>{
                stylesheet.addRule(rule[0], rule[1]);
            })
        }

        //console.log(rules);



        //console.timeEnd("SuitStyle parse time");
    }

    this.parse();
}


function ResponsiveElement(element) {
    if(element.hasAttribute("sid")) {
        this.id = element.getAttribute("sid");
    } else {
        this.id = ++Suit.idcounter;
        element.setAttribute("sid", this.id);
    }

    element.removeAttribute("responsive");

    this.target_element = element;
    this.reference_element = element.cloneNode(true);
  

    this.parse = () => {
        if(!document.body.contains(this.target_element)) {
            this.target_element = document.querySelector(`[sid='${this.id}'`);
        }

        if(!document.body.contains(this.target_element)) {
            console.error("Target element for responsive element was not found");
            return false;
        }

        let node_string = SuitUtils.nodeToString(this.reference_element);
        node_string = node_string.replace(/\{\{([^\}]|(?<!\})\})*\}\}/g, m=> {
            return eval(m.slice(2,-2));
        });

        let new_node_parent = document.createElement("html");
        new_node_parent.appendChild(SuitUtils.stringToNode(node_string));
        Suit.loadSemantics(new_node_parent);

        let new_node = new_node_parent.firstElementChild;

        this.target_element.parentElement.replaceChild(new_node, this.target_element);

        this.target_element = new_node;
    }
}

function InlineStyledElement(element) {

    if(element.hasAttribute("sid")) {
        this.id = element.getAttribute("sid");
    } else {
        this.id = ++Suit.idcounter;
        element.setAttribute("sid", this.id);
    }

    this.style_content = element.getAttribute("su-style");
    element.removeAttribute("su-style");
    this.target_element = element;


    this.parseStyle = () => {
        if(!document.body.contains(this.target_element)) {
            this.target_element = document.querySelector(`[sid='${this.id}'`);
        }

        if(!document.body.contains(this.target_element))
            throw("Target element for inline suit-styled element was not found");

        if(this.style_content) {
            let style_string = this.style_content.replace(/\$\{(?:[^\}]|(?<=\\)\})*\}/g, m=>{
                return eval(m.slice(2, -1));
            });

            this.target_element.setAttribute("style", style_string);
        }
    }
}


function ThemeValues(colors = {}, font = {}) {
    let listValues = (value, defaultValue) => {
        if(!value) return [defaultValue];
        
        let list = [defaultValue];
        
        if(typeof(value)=="string" || typeof(value)=="number") 
            list = [value];
        else 
            list = value;

        return list;
    }

    this.colorPrimary = listValues(colors.primary, "#407294");
    this.colorNeutral = listValues(colors.neutral, "#f5f5f5");
    this.colorAccent = listValues(colors.accent, "crimson");
    this.colorText = listValues(colors.text, "rgba(0, 0, 0, 0.87)");


    this.fontFamily = listValues(font.family, "Arial");
    this.fontSize = listValues(font.size, 16);
}



var IconsLoader = {
    loadIconDependencies: () => {
        let dropdown_arrows = document.querySelectorAll(".su-dropdown-icon-arrow");
        let menu_toggle_buttons = document.querySelectorAll(".su-sidebar-togglebtn");

        dropdown_arrows.forEach(el => {
            el.innerHTML = IconsLoader.formSvg(IconPaths.arrow_down);
        });

        menu_toggle_buttons.forEach(el=>{
            el.innerHTML = IconsLoader.formSvg(IconPaths.burger_menu);
        });
    },

    formSvg: (path) => {
        return `<svg style="height: 100%; width: 100%;" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
            <path d="${path}" fill="#323232"/>
        </svg>`;
    }
}





var IconPaths = {
    arrow_down: "M7.41 8.58997L12 13.17L16.59 8.58997L18 9.99997L12 16L6 9.99997L7.41 8.58997Z",
    burger_menu: "M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z"
}




var Device = {
    mobile: 1,
    tablet: 2,
    desktop: 3,

    stringOf: (device_id) => {
        switch(device_id) {
            case Device.mobile:
                return "mobile";
            case Device.tablet:
                return "tablet";
            case Device.desktop:
                return "desktop";
            default:
                return "unknown";
        }
    }
}

var Theme = {

    current_theme: new ThemeValues(),

    bounds: {
        mobile: [0, 490],
        tablet: [490, 1007],
        desktop: [1008, Infinity]
    },

    scaleValues: {
        mobile: 1,
        desktop: 1,
        tablet: 1
    },

    regularScreenWidths: {
        mobile: 480,
        tablet: 720,
        desktop: 1200
    },

    responsive_values: {
        "font-size": {
            mobile: 16,
            tablet: 16,
            desktop: 16,
            scaling: false
        },
        "main-padding": {
            mobile: 70,
            tablet: 50,
            desktop: 50
        },
        "show-sidebar": {
            mobile: false,
            tablet: false,
            desktop: true
        }
    },


    device: Device.desktop,
    
    getDeviceString: () => Device.stringOf(Theme.device),

    scale_ratio: 1,

    sizes: {
        navbar: 55,
        sidebar: 300
    },

    get: (category, index=0, all = false) => {
        let reference = Theme.current_theme[category];
        if(reference===undefined) throw new Error(`Unknown Theme property '${category}'`);

        if(typeof(reference)=="object") {
            // Checks if array
            if(reference[0]) {
                if(all) return reference;

                index = Math.min(reference.length-1, index);
                return reference[index];
            } else throw new Error(`Cannot retrieve Theme property '${category}': Unknown Object or Empty`);
        } else {
            // If an explicit value
            return reference;
        }

    },


    getAll: (category) => Theme.get(category, -1, true),

    getTheme: () => Theme.current_theme,

    setTheme: (theme) => {
        Theme.current_theme = theme;
        Suit.updateStyles();
    },

    updateScale: (doUpdateStyles = true) => {
        let screen_width = Math.floor(Math.max(
            document.documentElement.clientWidth,
            window.innerWidth) / window.devicePixelRatio);

        // let screen_width = Math.max(
        //     document.documentElement.clientWidth || 0,
        //     window.innerWidth || 0
        // );


        //console.log(`Changed screen width`);

        //document.write("\n Device Pixel Ratio: " + window.devicePixelRatio);

        let temp_scale;
        let temp_reg;
        let temp_device;
        if(screen_width >= Theme.bounds.mobile[0] &&
            screen_width <= Theme.bounds.mobile[1]) {
            temp_device = Device.mobile;
            temp_reg = Theme.regularScreenWidths.mobile;
        } else if(screen_width >= Theme.bounds.tablet[0] &&
            screen_width <= Theme.bounds.tablet[1]) {
            temp_device = Device.tablet;
            temp_reg = Theme.regularScreenWidths.tablet;
        } else {
            temp_device = Device.desktop;
            temp_reg = Theme.regularScreenWidths.desktop;
        }
        //console.log(screen_width);

        let apparent_scale = screen_width/temp_reg;

        Theme.scale = apparent_scale;
        Theme.device = temp_device;
        if(doUpdateStyles) Suit.updateStyles();

    },

    addResponsiveValue: (args) => {
        if(args.name && args.mobile && args.tablet && args.desktop)
            Theme.responsive_values[args.name] = args;
        else throw("Invalid responive value format.\nArgument must have values for name, mobile, tablet and desktop");
    },

    evaluateResponsiveValue: (responsive_args) => {
        let current_value;

        switch(Theme.device) {
            case Device.mobile:
                current_value = responsive_args.mobile;
            break;
            case Device.tablet:
                current_value = responsive_args.tablet;
            break;
            case Device.desktop:
                current_value = responsive_args.desktop;
            break;
        }

        let is_scaling = responsive_args.scaling===undefined ? 
            true : responsive_args.scaling;

        if(typeof(current_value)=="number") {
            if(is_scaling) current_value *= Theme.scale;
        }

        return current_value;
    },

    getR: (name) => {
        if(Theme.responsive_values[name]) 
            return Theme.evaluateResponsiveValue(Theme.responsive_values[name]);
        else throw("Responsive value '" + name +"' was not found");
    }


};


Theme.scale = Theme.scaleValues.desktop;


window.addEventListener("resize", ()=>{
    Theme.updateScale();
    //resetWindowResizeListener();

});


window.addEventListener("DOMContentLoaded", function(){
    if(window.hasSleeve) {
        console.log("HAS SLEEVE");
        if(Sleeve.isPrepared) 
            Suit.initialise();
        else Sleeve.onPrepared = ()=> Suit.initialise();
    } else {
        Suit.initialise();
    }

});



String.prototype.replaceAll = function(match, value) { return this.split(match).join(value)};
Element.prototype.hasClass = function(classname) {
    return this.classList.toString().split(" ").includes(classname);
} 


function sidebar(element, toVisible) {
    let scaffold = element.closest(".su-body") || document.querySelector(".su-body"); 
    if(!scaffold) throw("Cannot toggle sidebar - no scaffold found");

    let sidebar = scaffold.querySelector(".su-sidebar");
    if(!sidebar) throw("Cannot toggle sidebar - no sidebar found");

    
    let visible = toVisible!==undefined ? !toVisible : sidebar.hasAttribute("visible");
    
    let toggleVisibility = () => {
        if(!visible) {
            sidebar.style.display = "block";
            sidebar.setAttributeNode(document.createAttribute("visible"));
        } else {
            sidebar.style.display = "none";
            sidebar.removeAttribute("visible");
        }
    }

    if(sidebar.hasAttribute("transition")) {
        let is_left = true;
        if(sidebar.previousElementSibling.hasClass("su-main")) is_left = false;

        let from;
        let to;

        switch(sidebar.getAttribute("transition")) {
            case "slide":
                sidebar.style.display = "block";
                sidebar.style.position = "fixed";

                let width = getComputedStyle(sidebar).getPropertyValue("width");

                from = {left: is_left ? "-"+width : width};
                to = {left: "0px"};

                sidebar.animate(!visible ? [from, to] : [to, from], {duration: 120, easing: "ease"})
                    .onfinish = () => toggleVisibility();
            break; 
            case "fade":
                sidebar.style.display = "block";
                sidebar.style.position = "fixed";

                from = {opacity: "0"};
                to = {opacity: "1"};

                sidebar.animate(!visible ? [from, to] : [to, from], {duration: 120, easing: "ease"})
                    .onfinish = () => toggleVisibility();
            break;
            default:
                toggleVisibility();
        }
    } else toggleVisibility();


    
    
}


function dropdown(element) {
    if(element.hasClass("su-dropdown-btn")) {
        console.time("Dropdown time");
        let parent_element = element.parentElement;

        let is_sliding;

        if(parent_element.hasClass("su-dropdown-slide")) is_sliding = true;
        else if(parent_element.hasClass("su-dropdown")) is_sliding = false;
        else return 0;

        let items_element = element.nextElementSibling;

        //console.log(is_sliding);


        if(!items_element.hasClass("su-dropdown-items")) return 0;

        let items_height = 0;
        Array.prototype.slice.call(items_element.children).forEach(el=>{
            items_height += el.offsetHeight;
        });

        //console.log(items_height);

        let dropdown_icon = element.querySelector("[class*='su-dropdown-icon-arrow']");
       
        // if(!items_element.hasAttribute("data-height")) {
        //     items_element.setAttribute("data-height", items_element.clientHeight);
        // }

        //let items_height = items_element.getAttribute("data-height");

        if(!parent_element.hasAttribute("expanded")) {

            parent_element.setAttributeNode(document.createAttribute("expanded"));

            // to expand
            if(is_sliding)
                items_element.animate([
                        {height: (items_element.style.height || 0)+"px"}, 
                        {height: items_height + "px"}], 
                    {
                        duration: 100,
                        easing: "ease",
                        fill: "forwards"
                    });
            
            else
                items_element.style.display = "block";

            if(dropdown_icon)
                dropdown_icon.animate([
                    {transform: "rotate(0deg)"}, 
                    {transform: "rotate(-180deg)"}], 
                {
                    duration: is_sliding ? 100 : 0,
                    easing: "ease-out",
                    fill: "forwards"
                });
        
            

        } else {
            if(is_sliding) 
                items_element.animate([
                    {height: items_height + "px"}, 
                    {height: "0px"}], 
                {
                    duration: 100,
                    easing: "ease",
                    fill: "forwards"
                });
            else 
                items_element.style.display = "none";

            if(dropdown_icon)
                dropdown_icon.animate([
                    {transform: "rotate(-180deg)"}, 
                    {transform: "rotate(0deg)"}], 
                {
                    duration: is_sliding ? 100 : 0,
                    easing: "ease-out",
                    fill: "forwards"
                });
            parent_element.removeAttribute("expanded");

        }

        console.timeEnd("Dropdown time");
    }
}


function tab(element) {
    let tab_element = element.closest(".su-tabs");
    if(!tab_element) throw("No tab element found (with class 'su-tab')");

    let tab_pages = tab_element.querySelector(".su-tab-pages");
    if(!tab_pages) throw("Tab element had no pages (with class 'su-tab-pages')");

    let tab_buttons = tab_element.querySelector(".su-tab-buttons");

    let index = 0;
    let temp_element = element;
    while(temp_element = temp_element.previousElementSibling) index++;

    let past_height = 0;
    Array.prototype.slice.call(tab_pages.children).forEach(el=>{
        if(el.hasAttribute("tab-selected")) {
            let height = el.offsetHeight;
            if(height > past_height) past_height = height;       
            el.removeAttribute("tab-selected");
        }
    });

    console.log("PAST HEIGHT: " + past_height);

    let new_page = tab_pages.children[index];
    if(new_page) {
        new_page.setAttributeNode(document.createAttribute("tab-selected"));
        let page_height = new_page.offsetHeight;
        
        console.log("NEW PAGE HEIGHT: " + page_height);
        if(tab_element.hasAttribute("stretch") && page_height<past_height) {
            new_page.style.height = past_height + "px";
        }
    }
    //console.log(tab_pages.children);

    if(tab_buttons) {
        Array.prototype.slice.call(tab_buttons.children).forEach(el=>
            el.removeAttribute("tab-selected")
        );
        if(tab_buttons.children[index])
            tab_buttons.children[index]
                .setAttributeNode(document.createAttribute("tab-selected"));
    }

    Suit.fixBlockCodes(tab_element);
}

window.hasSuit = true;