function DynamicElement(element) {
    
    this.isClean = false;

    values = []; // [ [ String variable, boolean isState ] ]
    
    if(element.hasAttribute("rid")) {
        this.id = element.getAttribute("rid");
    } else {
        this.id = ++Sleeve.idcounter;
        element.setAttribute("rid", this.id);
    }

    this.target_element = element;
    this.reference_element = element.cloneNode(true);


    this.clean = () => {
        this.reference_element.removeAttribute("dynamic");
        this.target_element.removeAttribute("dynamic");
        this.isClean = true;
    }

    this.checkDoubleDynamic = () => {

        if(this.reference_element.querySelector("[dynamic]")) {
            Sleeve.throw("DoubleDynamicException: \n    A dynamic element cannot have a dynamic descendant.");

            
        };

        return true;
    }

    this.scanValues = () => {
        //console.log("Scanning values...");
        let element_string = SleeveDOM.nodeToString(this.reference_element);


        // Iterate through executables {{...}}

        element_string = element_string.replace(/\{\{([^}]|(?<!\})\})*\}\}/g, m=>{
            console.log(m);
            // Variables are searched and checked for any State objects.
            // If found any, this dynamic element is then registered
            // to the corresponding state objects

            // RegExp shall be used for searching variables

    

            // First, all strings must be removed to easen up search
            let exec  = m.replace(/(?:"([^"]|(?<=\\)")*")|(?:'([^']|(?<=\\)')*')/g, "");

            // Then, comes search for variables
            exec.replace(/([\w$_]+[\w\d_]*)/g, m=>{

                // Variable is checked if exists

                let found_value = window[m];

                if(found_value) {
                    // If variable exists, check if instance of State object
                    // If true, add this dynamic element as listener
                    if(found_value.isState) found_value.addListener(this);
                }

            });
        });

        
    }

    this.update = () => {
        if(!document.body.contains(this.target_element)) {
            console.log("Dynamic element not found. Troubleshooting...");

            let found = document.querySelector(`[rid='${this.id}']`);
            if(found)
                this.target_element = found;
            else
            throw new Error(`Dynamic element with rid ${this.id} may have been removed, or the rid attribute was modified externally`);
        }
        console.time("Dynamic element update time");
        let element_string = SleeveDOM.nodeToString(this.reference_element);
        element_string = element_string.replace(/\{\{([^}]|(?<!\})\})*\}\}/g, m=>{
            return eval(m.slice(1,-1));
        });

        let parsed_element = SleeveDOM.stringToNode(element_string);

        this.target_element.parentNode.replaceChild(parsed_element, this.target_element);
        this.target_element = parsed_element;

        if(!this.isClean) this.clean();
        console.timeEnd("Dynamic element update time");
    }

    this.scanValues();
    if(this.checkDoubleDynamic()) this.update();
}

window.hasSleeveDynamic = true;