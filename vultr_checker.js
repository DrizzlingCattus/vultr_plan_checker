const https = require("https");
const fs = require("fs");

const { makeEmailer } = require("./emailer.js");
const { cloParse } = require("./command_line_parser.js");


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
		"API-key" : insertedCLOption["--api-key"]
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
		return await pushRequest(option, dataCb, errorCb);
	};
};

const timestamp = (new Date()).toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});

const resultMessageFilePath = insertedCLOption["--save-path"];
//"/home/hentleman/vultr_checker_report.txt";

const planErrorMessage = "plan data request is not performed well";
const serverErrorMessage = "server info request is not performed well";

const pushPlanInfoRequest = bindOption(planInfoRequestOption);
const pushServerInfoRequest = bindOption(serverInfoRequestOption);

const makeVultrChecker = (vultrPlans) => {
	const plans = vultrPlans;
	return {
		makeReport: (serverInfo) => {
			let report = "";
			const planId = serverInfo.VPSPLANID;
			const currSpec = plans[planId].vcpu_count + " CORE," + plans[planId].name;

			report += "~~~~~vultr check result~~~~~~\n";
			try {
				const all = fs.readFileSync(resultMessageFilePath);
				let matchedArray = all.toString().match(/(current: )(.)+\n/);
				const prevCurrentSpec = matchedArray.shift().slice(9).trim();

				if(typeof prevCurrentSpec === "string" && prevCurrentSpec === currSpec) {
					report += "Same!\n";
				}else if(typeof prevCurrentSpec === "string" && prevCurrentSpec !== currSpec){
					report += "Changed!\n";
				}else {
					throw "error";
				}
				report += ("previous: " + prevCurrentSpec + "\n");
			}catch(err) {
				console.log(err.stack);
				report += "previous: " + "\n"
			}
			report += "current: " + currSpec + "\n";
			report += "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n";
			return report;
		}
	};
	
};

const sendEmail = (contentData) => {
	
};

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
	
	// emailer.sendEmail(filePrintedResult);
	
	return;
};
run();