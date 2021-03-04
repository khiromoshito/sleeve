function IteratingElement(element) {
    
    this.iterable = null;
    this.item_name = "";
    this.count = 0;

    this.rendered_nodes = [];

    if(element.hasAttribute("rid")) {
        this.id = element.getAttribute("rid");
    } else {
        this.id = ++Sleeve.idcounter;
        element.setAttribute("rid", this.id);
    }

    element.removeAttribute("iterating");
    element.removeAttribute("rid");
    element.removeAttribute("aid");
    element.removeAttribute("id");

    this.target_element = element;
    this.reference_element = element.cloneNode(true);
    this.rendered_nodes = [element];


    this.load = () => {
        if(this.reference_element.hasAttribute("i-items")) {
            let items_config = this.reference_element.getAttribute("i-items");
            let items_config_pair = items_config.split(":");
            if(items_config_pair.length!=2)
                throw(`Invalid i-items argument '${items_config}'. \n It must follow the format-- item:iterable`)
            
            this.item_name = items_config_pair[0].trim();
            let iterable_name = items_config_pair[1].trim();

            
            this.iterable = window[iterable_name];
            if(this.iterable===undefined)
                throw(`The iterable '${iterable_name}' is not defined.`);


            
            this.reference_element.removeAttribute("i-items");
            
        }
        else if(this.reference_element.hasAttribute("i-count")) {
            let count_string = this.reference_element.getAttribute("i-count").trim();

            if(count_string.startsWith("{{") && count_string.endsWith("}}")) 
                count_string = eval(count_string.slice(2, -2));

            this.count = Number(count_string);
            //console.log(this.count);
            if(!this.count || this.count < 0)
                throw(`Invalid count value '${count_string}'. This represents the number of iterations. It must be a positive number.`)
            this.reference_element.removeAttribute("i-count");
        }
    }

    this.iterate = () => {

        //console.time("Iterating element render time");
        let new_renders = [];

        if(this.iterable!=null) {
            let i = 0;
            for(let item of this.iterable) {
                new_renders.push(this.renderItem(i, [this.item_name, item]));
                i++;
            }
        } else {
            for(let i=0; i<this.count; i++)
                new_renders.push(this.renderItem(i));
        }

        if(!this.target_element.parentElement)
            throw new Error("Cannot render iterate elements. Anchor element must have a parent.");

        if(this.rendered_nodes.length>0) {

            this.target_element.insertAdjacentHTML("afterend", SleeveDOM.wrapAll(new_renders).innerHTML);
            
            this.rendered_nodes.forEach(node=>
                node.parentNode.removeChild(node));

            this.target_element = new_renders[0];
            this.rendered_nodes = new_renders;
        } 

        //console.timeEnd("Iterating element render time");
    }

    this.renderItem = (i, item_config = null) => {
        let clone_string = SleeveDOM.nodeToString(this.reference_element);
        
        clone_string = clone_string.replaceAll("%i%", i);

        if(item_config!=null)
            clone_string = clone_string.
                replaceAll(`%${item_config[0]}%`, item_config[1]+"");

        if(!this.reference_element.hasAttribute("dynamic")) {
            clone_string = clone_string.replace(/\{\{(?:[^\}]|\}(?!\}))*\}\}/g, m=>{
                return eval(m.slice(2, -2));
            
            });
        }

        let clone_node = SleeveDOM.stringToNode(clone_string);
        return clone_node;


    }


    this.load();
}

window.hasSleeveIterate = true;