"use strict";

const util = {};

util.isString = (input) => {
	return input instanceof String || typeof input === "string";
};


module.exports = util;