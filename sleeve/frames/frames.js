
var Frames = {
    idcounter: 0,
    animcounter: 0,

    initialise: () => {
        console.log("Initialising sleeve-frames");
        console.time("sleeve-frames load time");
        Frames.scanAnimatedElements();
        console.timeEnd("sleeve-frames load time");
    },
    
    _animated_elements: {},

    scanAnimatedElements: () => {
        let animated_elements = document.querySelectorAll("[animated]");
        animated_elements.forEach(el=>{
            let animated_element = new AnimatedElement(el);
            Frames._animated_elements[animated_element.anim_name] = animated_element;
        });
    },

    run: (anim_name) => {

        let animated_element = Frames._animated_elements[anim_name];
        if(animated_element) {
            animated_element.run();
        } else throw new Error(`FramesUnknownAnimationException:\n\tAnimation '${anim_name}' was not found`);
    },

    stringToMilliseconds: (duration) => {
        duration = duration.trim().toLowerCase();
        if(duration.endsWith("ms")) return Number(duration.slice(0, -2));
        else if(duration.endsWith("s")) return Number(duration.slice(0,-1))*1000;
        else return Number(duration.replace(/[^0-9]/g, ""));
    },

    parseStyle: (style_string) => {
        let styles = {};
        let style_list = style_string.split(";");
        style_list.forEach(style=>{
            let separator_pos = Math.max(0, style.indexOf(":"));
            let style_name = style.slice(0, separator_pos).trim();
            let style_value = style.slice(separator_pos+1).trim();

            //if(style_value.search("[^0-9]")==-1) style_value = Number(style_value);

            let camelled = style_name;
            let last = 0;
            while(camelled.indexOf("-", last)!=-1) {
                let dash_pos = style_name.indexOf("-", last);
                last = dash_pos;

                camelled = style_name.slice(0, dash_pos) +
                    style_name.charAt(dash_pos+1).toUpperCase() +
                    style_name.slice(dash_pos+2);

                
            }

            styles[camelled] = style_value;

        });

        return styles;
    }
}


function AnimatedElement(element) {
    
    this.target_element = null;



    this.from_style = {};
    this.to_style = {};

    this.args = {};
    
    this.id = ++Frames.idcounter;

    console.log("Initialising animated element ", element);

    element.setAttribute("aid", this.id);

    this.anim_name = element.hasAttribute("anim-name") ? 
        element.getAttribute("anim-name") : ("_default_" + this.id);
    
    this.duration = element.hasAttribute("anim-dur") ? 
        Frames.stringToMilliseconds(element.getAttribute("anim-dur")) : 300;

    this.delay = element.hasAttribute("anim-delay") ? 
        Frames.stringToMilliseconds(element.getAttribute("anim-delay")) : 0;


    
    this.clean = () => {
        let special_attributes = 
            [   "animated", "anim-name", "anim-dur", "anim-to-style", "anim-from-style",
                "anim-delay", "anim", "instant"];

        special_attributes.forEach(attr=>this.target_element.removeAttribute(attr));
    }


    this.run = () => {
        this.target_element.animate([
            this.from_style, this.to_style
        ], this.args);
    }


    if(element.hasAttribute("anim-to-style")) {
        let to_style_string = element.getAttribute("anim-to-style");
        console.log("--- Found to-style: ", to_style_string);
        let to_style_list = to_style_string.split(";");
        to_style_list.forEach(style=>{
            let separator_pos = Math.max(0, style.indexOf(":"));
            let style_name = style.slice(0, separator_pos).trim();
            let style_value = style.slice(separator_pos+1).trim();

            //if(style_value.search("[^0-9]")==-1) style_value = Number(style_value);


            this.to_style[style_name] = style_value;
        })
    }

    let from_style_temp = {};

    // Parses from_style values from element
    if(element.hasAttribute("anim-from-style")) {
        let from_style_string = element.getAttribute("anim-from-style");
        console.log("--- Found from-style: ", from_style_string);
        let from_style_list = from_style_string.split(";");
        from_style_list.forEach(style=>{
            let separator_pos = Math.max(0, style.indexOf(":"));
            let style_name = style.slice(0, separator_pos).trim();
            let style_value = style.slice(separator_pos+1).trim();

            //if(style_value.search("[^0-9]")==-1) style_value = Number(style_value);


            from_style_temp[style_name] = style_value;
        });
    }

    let computed_styles = getComputedStyle(element);
    //console.log("--- Computed styles: ", computed_styles);

    // Iterates through to_style to scan matching from_style values
    Object.keys(this.to_style).forEach( style_name =>{

        // If found a match
        if(from_style_temp[style_name]) {
            this.from_style[style_name] = from_style_temp[style_name];
        } else {
            // If not found, refer to the element computedStyleValues

            // If property exists
            if(computed_styles[style_name]) {
                this.from_style[style_name] = 
                    computed_styles.getPropertyValue(style_name);
            } else {
                // If not even in computed values, remove to_style value
                delete this.to_style[style_name];
            }
        }
    });



    let toCamelCase = (obj) => {
        Object.keys(obj).forEach(style_name=>{
            let last = 0;

            let camelled = style_name;
            while(camelled.indexOf("-", last)!=-1) {
                let dash_pos = style_name.indexOf("-", last);
                last = dash_pos;

                camelled = style_name.slice(0, dash_pos) +
                    style_name.charAt(dash_pos+1).toUpperCase() +
                    style_name.slice(dash_pos+2);

                
            }

            let style_value = obj[style_name];
            delete obj[style_name];
            obj[camelled] = style_value;

        });
    };

    toCamelCase(this.from_style);
    toCamelCase(this.to_style);

    console.log("Parsed from-style", this.from_style);
    console.log("Parsed to-style: ", this.to_style);




    let args_temp = {
        fill: "forwards"
    };

    let args_array = [
        ["duration", this.duration],
        ["delay", this.delay]
    ];

    args_array.forEach(arg=>{
        if(arg[1]!==undefined && arg[1]!=null)
            args_temp[arg[0]] = arg[1];
    });

    this.args = args_temp;

    console.log("Parsed arguments: ", args_temp);
    

    this.target_element = element;
    if(element.hasAttribute("instant")) window.addEventListener("load", ()=>this.run());
    this.clean();
    
}

// if(Sleeve) {

// }
// Sleeve.onPrepared = Frames.initialise;

// window.addEventListener("load", ()=> {
//     if(window.hasSleeve) {
//         if(Sleeve.isPrepared) Frames.initialise();
//         else Sleeve.onPrepared = () => Frames.initialise();
//     } else Frames.initialise();
// });

window.addEventListener("load", ()=> {
    Frames.initialise();
});

var Colors = {
    hexToNumber: hex0 => {
        let hex = hex0;
        if(hex.startsWith("#")) hex = hex.slice(1);

        // let hex_sequence = "0123456789abcdef";
        // if(hex.search(new RegExp(`[^${hex_sequence}]`, "g"))!=-1)
        //     throw new Error("Hex values must be in range 0-9 and a-f\n");
        // if(hex.length!=6)
        //     throw new Error("Hex color must have 6 digits\n");
        
        // let relatives = [];
        // let bases = [];
        

        // let values = hex.split("").map((section, i)=>{
        //     let max = 16;
        //     let base = 16**i;

        //     bases.push(base);
        //     let digit_value = hex_sequence.indexOf(section[0]);
        //     relatives.push(digit_value);
        //     return digit_value * (16**i);
        // });

        // let offsets = bases.map((base, i)=>values[i]-base);

        // console.log("Digit values: ", relatives);
        // console.log("Bases: ", bases);
        // console.log("Offsets: ", offsets);

        // console.log("Values: ", values);
        // console.log("\n");
        

        // return values.reduce((a,b)=>a+b); 

        return parseInt(hex, 16);
    },

    numberToHex: number => {
        if(number<0 || number>16777215)
            throw("Color number value must be between 0 and 16,777,215\n");

        let hex = number.toString(16);
        hex = "0".repeat(6-hex.length) + hex;

        return "#"+hex;
        
    },

    tween: (hex1, hex2, fraction=1) => {
        fraction = Math.max(0, Math.min(1, fraction));
        let hex1num = Colors.hexToNumber(hex1);
        let hex2num = Colors.hexToNumber(hex2);
        let gap = Math.abs(hex1num-hex2num);

        let relative_position = 
            Math.max(0, Math.min(16777215, Math.round(fraction*gap)));

        
        let position = Math.min(hex1num, hex2num) + relative_position;
        let colorValue = Colors.numberToHex(position);

        return colorValue
    }
}


function FrameAnim(anims=null, duration=null) {

    this._animations = {};
    this.animcounter = 0;

    this.delay = 0;
    this.fill = "forwards";
    this.easing = "linear";
    this.direction = "normal";

    this.isFrameAnimation = true;


    this.keyframes = [{}, {}];

    this.duration = duration ? duration : 300;

    if(anims) {
        let anims_list = anims.split(",");
        if(anims_list.length)
        anims_list.forEach(anim=>{
            anim = anim.trim().toLowerCase();
        
            switch(anim) {
                case "fade-in":
                    this.keyframes[0].opacity = 0;
                    this.keyframes[1].opacity = 1;
                    this.easing = "ease-out";
                break;
                case "fade-out":
                    this.keyframes[0].opacity = 1;
                    this.keyframes[1].opacity = 0;
                    this.easing = "ease-out";
                break;
                case "rotate":
                    this.keyframes[0].transform = 'rotate(0deg)';
                    this.keyframes[1].transform = 'rotate(360deg)';
                    this.easing = "ease-out";

                    if(!duration) this.duration = 600;
                break;
                case "rotate-cc":
                    this.keyframes[0].transform = 'rotate(360deg)';
                    this.keyframes[1].transform = 'rotate(0deg)';
                    this.easing = "ease-out";

                    if(!duration) this.duration = 600;
                break;
            }
        });
    }

    this.drive = (element, options = {}) => {
        let args = {};
        args.duration = options.duration || this.duration;
        args.delay = options.delay || this.delay;
        args.fill = options.fill || this.fill;
        args.direction = options.direction || this.direction;
        args.easing = options.easing || this.easing;

        let easing_reversible = ["ease-in", "ease-out"];
        let easing_reverse = ["ease-out", "ease-in"];
        if(args.direction=="reverse" && easing_reversible.includes(args.easing))
            args.easing = easing_reverse[easing_reversible.indexOf(args.easing)];


        let animation = element.animate(this.keyframes, args);
        let pos = this.animcounter++;

        this._animations[pos]=animation;

        let self = this;
        animation.onfinish = function() {
            self.onFinish(element);
            delete self._animations[pos];
        };

        return animation;
    }

    this.onFinish = (element) => {};

    this.cancelAll = () => Object.values(this._animations).forEach(anim=>anim.cancel());

    this.finishAll = () => Object.values(this._animations).forEach(anim=>anim.finish());

    this.reverseAll = () => Object.values(this._animations).forEach(anim=>anim.reverse());

}

function FrameAnimSequence(frame_anims = [])  {
    isCancelled = false;
    isPlaying = false;
    anim_index = 0;
    
    animations = [];
    currentAnimation = new Animation();


    this.frame_anims = frame_anims;

    this.drive = (element, options = {}, i=0, add = 1, count = 0, initial = true) => {
        
        
        let fill = options.fill || "forward";
        let direction = options.direction || "normal";

        let iterations = (options.iterations || 1) * (direction=="alternate" ? 2 : 1);
        

        if(initial) {
            if(direction=="reverse") {
                add = -1;
                i = this.frame_anims.length-1;
            }
            this.isCancelled = false;
            this.isPlaying = false;
        }

        //console.log({iterations, fill, direction});

        
        if(this.frame_anims.length>0) {
            if(i<this.frame_anims.length && i>=0) {
                const anim = this.frame_anims[i];
                if(anim.isFrameAnimation) {
                    this.currentAnimation = anim.drive(element, {direction: add>0 ? "normal" : "reverse"});
                    this.animations.push(this.currentAnimation);

                    let self = this;
                    this.currentAnimation.onfinish = function() {
                        //console.log(`Animation ${i+1} of ${self.frame_anims.length} completed`);
                        if(!self.isCancelled) {
                            self.drive(element, options, i+add, add, count, false);
                        } else {
                            console.log("Sequence animation ended");
                        }
                    };

                    this.isPlaying = true;
                } else throw new Error("Given object was not an instance of FrameAnimation");
                
            } else {
                count++;
                if(fill=="none") this.revert();
                
                let add_new = direction=="alternate" ? -add : add;
                let i_new = (direction=="reverse" || (direction=="alternate" && add_new<0))
                    ? this.frame_anims.length - 1 : 0;
                
                if(iterations==Infinity || count<iterations)
                    this.drive(element, options, i_new, add_new, count, false);
                else this.isCancelled = true;
            }
        }
    }

    this.cancel = () => {
        console.log("Cancelling animation");
        this.isCancelled = true;
        this.revert();
        //this.currentAnimation.cancel();
    }

    this.revert = () => {
        while(this.animations.length>0) 
            this.animations.pop().cancel();
        
        console.log("Animation reverted");
    }
}

HTMLElement.prototype.animToStyle = function(to_style, duration = 150, easing = "ease-in") {
    return this.animate([{}, Frames.parseStyle(to_style)], {
        duration: duration,
        easing: easing,
        fill: "forwards"
    });
}

HTMLElement.prototype.drive = function(...frame_anims) {
    if(frame_anims.length==1)
        return frame_anims[0].drive(this);
    else {
        let anim_sequence = new FrameAnimSequence(frame_anims);
        anim_sequence.drive(this);
    
        return anim_sequence;
    }
}