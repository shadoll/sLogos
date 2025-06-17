// This file lists all supported collections for the gallery
export const collections = [
    {
        name: 'logos',
        label: 'Logos',
        baseDir: 'logos',
        genDir: 'logos_gen',
        dataFile: 'data/logos.json'
    },
    {
        name: 'flags',
        label: 'Flags',
        baseDir: 'flags',
        genDir: 'flags_gen',
        dataFile: 'data/flags.json'
    }
];
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { collections };
}
