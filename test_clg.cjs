const clg = require('crossword-layout-generator');

const inputWords = [
    { answer: "HELLO", clue: "A greeting" },
    { answer: "WORLD", clue: "The earth" }
];

const layoutObj = (clg.generateLayout || clg.default?.generateLayout)(inputWords);

console.log(JSON.stringify(layoutObj, null, 2));
