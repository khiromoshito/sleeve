
var IconsLoader = {
    loadIconDependents: () => {
        let dropdown_arrows = document.querySelectorAll(".su-dropdown-icon-arrow");
        dropdown_arrows.forEach(el => {
            el.innerHTML = IconsLoader.formSvg(IconPaths.arrow_down);
        });
    },

    formSvg: (path) => {
        return `<svg style="height: 100%; width: 100%; max-height: 30px; max-width: 30px;" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
            <path d="${path}" fill="#323232"/>
        </svg>`;
    }
}





var IconPaths = {
    arrow_down: "M7.41 8.58997L12 13.17L16.59 8.58997L18 9.99997L12 16L6 9.99997L7.41 8.58997Z"
}


window.addEventListener("load", ()=>IconsLoader.loadIconDependents());