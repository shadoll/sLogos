// This file lists all supported collections for the gallery
export const collections = [
    {
        name: 'logos',
        label: 'Logos',
        baseDir: 'images/logos',
        genDir: 'images/logos_variants',
        dataFile: 'data/logos.json'
    },
    {
        name: 'flags',
        label: 'Flags',
        baseDir: 'images/flags',
        genDir: 'images/flags_variants',
        dataFile: 'data/flags.json'
    },
    {
        name: 'emblems',
        label: 'Emblems',
        baseDir: 'images/emblems',
        genDir: 'images/emblems_variants',
        dataFile: 'data/emblems.json'
    }
];
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { collections };
}
