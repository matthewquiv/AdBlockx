const fs = require('fs');

// Read the whole file as a string
const data = fs.readFileSync('hostnames.txt', 'utf-8');

// Split into lines
const lines = data.split(/\r?\n/);

console.log(lines); // lines is an array of strings
