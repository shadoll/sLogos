// This file lists all supported collections for the gallery
export const collections = [
    {
        name: 'logos',
        label: 'Logos',
        title: 'Logo Gallery',
        baseDir: 'images/logos',
        varDir: 'images/logos_variants',
        dataFile: 'data/logos.json'
    },
    {
        name: 'flags',
        label: 'Flags',
        title: 'Flag Gallery',
        baseDir: 'images/flags',
        varDir: 'images/flags_variants',
        dataFile: 'data/flags.json'
    },
    {
        name: 'emblems',
        label: 'Emblems',
        title: 'Emblem Gallery',
        baseDir: 'images/emblems',
        varDir: 'images/emblems_variants',
        dataFile: 'data/emblems.json'
    }
];
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { collections };
}
