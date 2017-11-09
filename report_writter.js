"use strict";

const makeReportWritter = (delimeterSymbol = "-") => {
	let headline = "";
	let headlineMaxWidth = 0;
	
	let body = "";
	
	let bottomline = "";
	let bottomlineMaxWidth = 0;
	
	let delimeter = delimeterSymbol;
	return {
		getReport: () => {
			const delimeterline = delimeter.repeat((headlineMaxWidth + bottomlineMaxWidth)/2) + "\n";
			const reportString = headline +
				  delimeterline +
				  body +
				  delimeterline +
				  bottomline;
				  
			return reportString;
		},
		
		writeToHeadLine: (input) => {
			if(headlineMaxWidth < input.length) {
				headlineMaxWidth = input.length;
			}
			headline += (input + "\n");
		},
		
		writeToBody: (input) => {
			body += (input + "\n");
		},
		
		writeToBottomLine: (input) => {
			if(bottomlineMaxWidth < input.length) {
				bottomlineMaxWidth = input.length;
			}
			bottomline += (input + "\n");
		}
	};
};

module.exports = { makeReportWritter };
