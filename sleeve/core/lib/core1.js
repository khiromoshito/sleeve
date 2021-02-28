

/** Picks an element (first match) by a CSS selector */
var E = (selector) => document.querySelector(selector);

/** Picks all matching elements by a CSS selector */
var Es = (selector) => document.querySelectorAll(selector);

var Sleeve = {
    initialise: async function() {
        console.log("Initialising...");
        // console.time("Snippets load time");
        //await Sleeve.loadSnippets();
        // console.timeEnd("Snippets load time");
        //Sleeve.update(true);
        // Sleeve.onPrepared();
        // Sleeve.isPrepared = true;

    },

    isPrepared: false,
    onPrepared: function(){},
    updateZeroCounter: 0,

    update: function(isInitial = false) {
        console.log("\n\n\n\n\nUpdating sleeve...");
        console.time("Sleeve update time");


        Sleeve.scanAbstractElements();
        Sleeve.parseAbstractModels();
        SleeveDOM.parseAbstractInstances(document.body);

        Sleeve.scanIteratingElements();

        Sleeve.replicateReferencedElements();
        Sleeve.scanDynamicElements();



        console.timeEnd("Sleeve update time");
    }
};
