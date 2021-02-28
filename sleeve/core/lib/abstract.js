
function AbstractElement(element) {

    this.model_element = null;
    this.instance_elements = [];
    this.instances_unparsed = [];
    
    this.reference_element = element;
    this.tagName = element.tagName;
    element.parentNode.removeChild(element);


    this.setupModel = () => {
        let model = null;
        let content = this.reference_element.innerHTML;

        if(!this.reference_element.hasAttribute("model")) {

            
            let all_children = SleeveDOM.stringToNodeList(this.reference_element.innerHTML.trim());
            let element_children = this.reference_element.children;

            if(all_children.length==1 && element_children==1) {
                model = children[0];
                content = model.innerHTML;
            } else {
                model = document.createElement("div");
            }
        } else model = document.createElement(this.reference_element.getAttribute("model"));
            
        model.innerHTML = content;


        let model_attributes = SleeveUtils.toArray(this.reference_element.attributes);
        let model_attributes_others = [];

        model_attributes.forEach(attr=>{
            if(attr.name!="model" && attr.name!="abstract") {
                model_attributes_others.push(attr.name);
            }
        });

        if(model_attributes_others.length>0) {
            console.warn(
                "SleeveAbstractElementWarning:\n", 
                "   Abstract elements should not contain any attributes other than 'model'.",
                "\n    Place these attributes in the abstract model instead.",
                "\n\n", "Instead of...\n", 
                "<abstract-element abstract style='color: red'>\n\t<span></span>\n </abstract-element>",
                "\n\n", "Do...\n",
                "<abstract-element abstract>\n\t<span style='color: red'></span>\n </abstract-element>",
                "\n\n\nOffending abstract tag:", this.reference_element,
                "\nFound unnecessary attribute(s): ",
                `[${model_attributes_others.join(",")}]`);
            
        }
        
        this.model_element = model;

        //console.log("Created model: ", this.model_element);
    }

    this.scanInstances = () => {
        let instances = SleeveUtils.toArray(document.querySelectorAll(this.tagName+":not([rid])"));
        console.log("Found " + instances.length + " new instances of " + this.tagName);
        this.instances_unparsed = this.instances_unparsed.concat(instances.map(i=>new AbstractInstanceElement(i)));
    }


    this.parseInstances = () => {
        if(this.instances_unparsed.length>0) {
            this.instances_unparsed.forEach(instance=>instance.parse());
            this.instance_elements = this.instance_elements.concat(this.instances_unparsed);
            this.instances_unparsed = [];
        }
    }

    this.update = () => {
        this.scanInstances();
        this.parseInstances();
    }

    this.setupModel();
}

function AbstractInstanceElement(element) {
    this.reference_element = element;
    this.attributes = SleeveUtils.toArray(element.attributes);
    this.tagName = element.tagName;
    this.id = ++Sleeve.idcounter;
    console.log("Initialised " + this.tagName + " instance with rid " + this.id);
    element.setAttribute("rid", this.id);


    this.parse = () => {
        
        if(!document.body.contains(this.reference_element)) {
            // console.log("Uh-oh. It seems that the target instance of '" + this.tagName + 
            // "' with rid " + this.id + " was either removed or replaced from the DOM tree.");

            // console.log("Performing troubleshoot...");
            // console.log("Locating instance with rid " + this.id);

            let new_reference = document.querySelector(`[rid='${this.id}']`);
            if(new_reference) {
                //console.log("Found a tag matching the given id. Evaluating...");
                if(new_reference.tagName==this.tagName) {
                    //console.log("Alright, the match has been confirmed. Tweaking reference...");
                    this.reference_element = new_reference;
                    //console.log("Troubleshoot successful. Continuing...");
                }
                
            } else {
                //console.log("There was no matching tag found. Aborted.");
                return false;
            }
        } 

        let abstract_element = Sleeve._abstract_elements[this.tagName];

        if(abstract_element) {
            let target_element = abstract_element.model_element.cloneNode(true);

            let value_attributes = [];
            this.attributes.forEach(attr=>{
                if(!Sleeve._special_attributes.includes(attr.name)
                    && !target_element.hasAttribute(attr.name) &&
                    attr.name.startsWith("value-")) {

                        //console.log(attr.name);

                        if(Sleeve._abstract_elements[target_element.tagName])
                            target_element.setAttribute(attr.name, attr.value);

                        value_attributes.push([attr.name.slice(6), attr.value]);
                        this.reference_element.removeAttribute(attr.name);
                    
                }
            });

            let target_element_string = SleeveDOM.nodeToString(target_element);

            value_attributes.forEach(attr=>{
                target_element_string =  
                        target_element_string.replaceAll(
                            "%" + attr[0] + "%", attr[1]);
            });
            

            this.reference_element.innerHTML = target_element_string;
        } else {
            console.error("Cannot create instance of '" + this.tagName + "' element.\n\n" + 
            "The abstract element was not found.");
        }
    }


    this.parse();
}

window.hasSleeveAbstract = true;