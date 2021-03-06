var HTMLFormat = {
    entities: {
        "<": "&lt;",
        "=": "&equals;",
        ":": "&colon;",
        "\"": "&quot;",
        "/": "&sol;",
        ">": "&gt;",
        " ": "&nbsp;"
    },

    variable: "skyblue",
    tagsymbol: "purple",
    tagname: "blue",
    attributename: "crimson",
    attributevalue: "orange",
    text: "white",
    comment: "gray"
};

var JSFormat = {
    reserved: [
        "var", "let", "const",
        "if", "else", "switch", "case", "break",
        "function", "class", 
        "while", "do", "for", "in", "of",
        "try", "catch", "finally", "throw"
    ],
    constants: [
        "null", "undefined", "Infinity", "NaN", "true", "false"
    ],
    variable: "skyblue",
    number: "green",
    string: "orange",
    text: "white",
    symbols: "",
    comment: "gray",

    reserved: "purple",
    constants: "blue"
};

var CodeFormatter = {
    getFormatted: (content, type) =>
        `<span class="su-code-html-color-` + type + `">`+content+`</span>`,


    getColorFormatted: (content, color) =>
        `<span style="color: ` + color + `">`+content+`</span>`,


    format: (type, content) => {
        //console.log(type);
        switch(type.toLowerCase()) {
            case "html":
                return CodeFormatter.formatHTML(content);
            break;
            case "js":
                return CodeFormatter.formatJS(content);
            break;
            default:
                return content.replace(/\</, "&lt;")
                    .replace(/\n/g, "<br>")
                    .replace(/ /g, "&nbsp;");
        }
    },

    formatHTML: (raw_string) => {
        //console.time("Code formatting time");
        let formatted = raw_string;
        
        Object.keys(HTMLFormat.entities).forEach(ent=>{
           formatted = formatted.split(ent).join(HTMLFormat.entities[ent]); 
        });




        //console.log(formatted);

        // Attribute names (variable-looking)
        formatted = formatted.replace(/(?<=\&lt;[\w_]+[\w\d_-]*(?:(?:\&nbsp;)|\n)+(?:[\w_]+[\w\d_-]*(?:\&equals;\&quot;([^&]|&(?!quot;))*\&quot;)?(?:(?:\&nbsp;)|\n)+)*)(?:[\w_]+[\w\d_-]*)/g, 
            m=>CodeFormatter.getFormatted(m, "attributename"));


        // Tag names
        formatted = formatted.replace(/(?<=\&lt;(?:\&sol;)?)(?:[\w_]+[\w\d_-]*)/g, 
            m=>CodeFormatter.getFormatted(m, "tagname"));





        
        

        
        // String attribute values
        formatted = formatted.replace(/(?:\&quot;([^\&]|(?:\&(?!quot;))|(?:(?<=\\)\&(?=quot;)))*\&quot;)/g, 
            m=>CodeFormatter.getFormatted(m, "attributevalue"));


        // Comments
        formatted = formatted.replace(/\&lt;\!\-\-([^\-]|\-(?!\-\&gt;))*\-\-\&gt;/g, 
            m=>CodeFormatter.getFormatted(m, "comment"));


        // Tag symbols
        formatted = formatted.replace(/(?:\&lt;(?:\&sol;)?)|(?:\&gt;)|(?:\&equals;)/g, 
            m=>CodeFormatter.getFormatted(m, "tagsymbol"));


        formatted = formatted.replace(/\n/g, "<br>");

        let temp_cont = document.createElement("div");
        temp_cont.innerHTML = formatted;

        temp_cont.querySelectorAll("span span").forEach(el=>{
            el.parentNode.replaceChild(document.createTextNode(el.innerHTML), el);
        });

        //console.timeEnd("Code formatting time");


        return temp_cont.innerHTML;
    },


    formatJS: (raw_string) => {
        let formatted = raw_string;
        
        formatted = formatted.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
        return formatted;


        // First, comments

    }
}

window.hasCodeFormatter = true;

// window.addEventListener("DOMContentLoaded", ()=>{
//     document.querySelectorAll("code,.su-code").forEach(el=>
//         el.innerHTML = el.innerHTML.replace(/\</g, "&lt;")
//     );
// });