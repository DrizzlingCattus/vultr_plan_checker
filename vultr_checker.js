const https = require("https");
const fs = require("fs");

const nodemailer = require("nodemailer");


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
		"API-key" : process.argv[3]
	}
}

planInfoRequestOption.agent = new https.Agent({
	keepAlive: false
});
serverInfoRequestOption.agent = new https.Agent({
	keepAlive: false
});


const pushRequest = (httpsOption, dataCb, errorCb) => {
	const request = https.request(httpsOption, (response) => {
		response.setEncoding("utf8");

		response.on("data", (chunck) => {
			if(response.statusCode !== 200) {
				return null;
			}
			dataCb(chunck);
		});

		response.on("error", (err) => {
			errorCb(err);
		})
	});
	request.end();
	return request;
};
const bindOption = (option) => {
	return async (dataCb, errorCb) => {
		return pushRequest(option, dataCb, errorCb);
	};
};

let plans = null;

const timestamp = (new Date()).toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});

const resultMessageFilePath = "/home/hentleman/vultr_checker_report.txt";

const planErrorMessage = "plan data request is not performed well";
const serverErrorMessage = "server info request is not performed well";

const pushPlanInfoRequest = bindOption(planInfoRequestOption);
const pushServerInfoRequest = bindOption(serverInfoRequestOption);

const run = async () => {
	const first = await pushPlanInfoRequest(
		(chunck) => {
			plans = JSON.parse(chunck);
		},
		(err) => {
			fs.writeFileSync(resultMessageFilePath, planErrorMessage + " in response for " + err.stack);
			exit(0);
		}
	);
	first.on("error", (err) => {
		fs.writeFileSync(resultMessageFilePath, planErrorMessage + " in request for " + err.stack);
		exit(0);
	});
	
	const second = await pushServerInfoRequest(
		(chunck) => {
			const serverInfo = JSON.parse(chunck);
			// unwrapping obj
			for(let objId in serverInfo) {
				const planId = serverInfo[objId].VPSPLANID;
				const currSpec = plans[planId].vcpu_count + " CORE," + plans[planId].name;
				console.log(currSpec);
				
// 				let result = "";
// 				try {
// 					result += fs.readFileSync(resultMessageFilePath);
// 				}
// 				fs.writeFileSync(resultMessageFilePath, "current: " + currSpec);
			}
		},
		(err) => {
			fs.writeFileSync(resultMessageFilePath, serverErrorMessage + " in response for " + err.stack);
			exit(0);
		}
	);
	second.on("error", (err) => {
		fs.writeFileSync(resultMessageFilePath, serverErrorMessage + " in request for " + err.stack);
		exit(0);
	});
	return;
};
run();