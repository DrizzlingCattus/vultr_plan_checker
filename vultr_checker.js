"use strict";

const https = require("https");
const fs = require("fs");

const { makeEmailer } = require("./emailer.js");
const { cloParse, COMMAND_LINE_OPTION } = require("./command_line_parser.js");
const util = require("./util.js");
const { makeReportWritter } = require("./report_writter.js");


const insertedCLOption = cloParse(process.argv);

const planInfoRequestOption = {
	protocol: "https:",
	host: "api.vultr.com",
	port: 443,
	path:"/v1/plans/list?type=vc2",
	method: "GET",
};
const serverInfoRequestOption = {
	protocol: "https:",
	host: "api.vultr.com",
	port: 443,
	path:"/v1/server/list",
	method: "GET",
	headers: {
		"API-key" : insertedCLOption[COMMAND_LINE_OPTION.API_KEY]
	}
}

planInfoRequestOption.agent = new https.Agent({
	keepAlive: false
});
serverInfoRequestOption.agent = new https.Agent({
	keepAlive: false
});


const pushRequest = (httpsOption, dataCb, errorCb) => {
	return new Promise((resolve, reject) => {
		let result = null;
		const request = https.request(httpsOption, (response) => {
			response.setEncoding("utf8");

			response.on("data", (chunck) => {
				if(response.statusCode !== 200) {
					return null;
				}
				result = dataCb(chunck);
			});

			response.on("error", (err) => {
				errorCb(err);
			});

			response.on("end", () => {
				resolve(result);
			});
		});
		request.end();
		return result;
	});
};
const bindOption = (option) => {
	return async (dataCb, errorCb) => {
		return pushRequest(option, dataCb, errorCb);
	};
};

const timestamp = (new Date()).toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});

const resultMessageFilePath = insertedCLOption[COMMAND_LINE_OPTION.SAVE_PATH];

const planErrorMessage = "plan data request is not performed well";
const serverErrorMessage = "server info request is not performed well";

const pushPlanInfoRequest = bindOption(planInfoRequestOption);
const pushServerInfoRequest = bindOption(serverInfoRequestOption);


const reporter = makeReportWritter();

const makeVultrChecker = (vultrPlans) => {
	const plans = vultrPlans;
	return {
		makeReport: (serverInfo) => {
			const planId = serverInfo.VPSPLANID;
			const currSpecPrice = plans[planId].price_per_month;
			const currSpec = plans[planId].vcpu_count + " CORE," +
				  plans[planId].name + "," +
				  currSpecPrice + "$";
			
			reporter.writeToHeadLine(timestamp);
			reporter.writeToHeadLine("##vultr check result##");
			try {
				const all = fs.readFileSync(resultMessageFilePath);
				let matchedArray = all.toString().match(/(current: )(.)+\n/);
				const prevCurrentSpec = matchedArray.shift().slice(9).trim();

				if(util.isString(prevCurrentSpec) && prevCurrentSpec === currSpec) {
					reporter.writeToBottomLine("Same!");
				}else if(util.isString(prevCurrentSpec) && prevCurrentSpec !== currSpec){
					reporter.writeToBottomLine("Changed!")
				}else {
					throw "error";
				}
				reporter.writeToBody(`previous: ${prevCurrentSpec}`);
			}catch(err) {
				console.log(err.stack);
				reporter.writeToBody("previous: ");
			}
			reporter.writeToBody(`current: ${currSpec}`);
			return reporter.getReport();
		}
	};
};

const emailer = makeEmailer("gmail", {
	type: "OAuth2",
	user: insertedCLOption[COMMAND_LINE_OPTION.EMAIL_TO],
	clientId: insertedCLOption[COMMAND_LINE_OPTION.CLIENT_ID],
	clientSecret: insertedCLOption[COMMAND_LINE_OPTION.CLIENT_SECRET],
	refreshToken: insertedCLOption[COMMAND_LINE_OPTION.REFRESH_TOKEN],
	accessToken: insertedCLOption[COMMAND_LINE_OPTION.ACCESS_TOKEN],
	expires: 3600
});
const run = async () => {
	const plans = await pushPlanInfoRequest(
		(chunck) => {
			const plans = JSON.parse(chunck);
			return plans;
		},
		(err) => {
			fs.writeFileSync(
				resultMessageFilePath, 
				planErrorMessage + " in response for " + err.stack + "\n"
			);
			exit(0);
		}
	);
	
	const filePrintedResult = await pushServerInfoRequest(
		(chunck) => {
			// [{...}, {...}, {...}, ...]
			const serverInfoArray = Object.values(JSON.parse(chunck));
			const checker = makeVultrChecker(plans);
			let result = "\n";
			
			for(let info of serverInfoArray) {
				result += checker.makeReport(info);
				result += "\n";
			}
			console.log(result);
			fs.writeFileSync(resultMessageFilePath, result);
			return result;
		},
		(err) => {
			fs.writeFileSync(
				resultMessageFilePath, 
				serverErrorMessage + " in response for " + err.stack + "\n"
			);
			exit(0);
		}
	);
	
	emailer.send({
		from: '"vultr private server"', // sender address
		to: insertedCLOption[COMMAND_LINE_OPTION.EMAIL_TO], // list of receivers
		subject: `[${timestamp}] Vultr_Checker's Report`, // Subject line
		text: filePrintedResult, // plain text body
	});
	
	return;
};
run();