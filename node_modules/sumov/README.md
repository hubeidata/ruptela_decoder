# Sumov

Computes the sum of all numeric values in an (multilevel) object.

To sum up to N levels of an object, just pass N as a second parameter.

## Usage

```js
const sumov = require('sumov');

let sum = sumov({a: 2, b: ["2", null, [], {a: {a: -1.0}}], c: {quick: "maths"}});
// => 3

//sum up to 2 levels
sum = sumov({a: 2, b: ["2", null, [], {a: {a: -1.0}}], c: {quick: "maths"}}, 2);
// => 4
```

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm i --save sumov
```

See the [package source](https://github.com/dimitrievski/sumov) for more details.
