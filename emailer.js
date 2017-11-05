const nodemailer = require("nodemailer");


const SERVICE_LIST = ["gmail"];

const isServiceName = (input) => {
	const isString = input instanceof String || typeof input === "string";
	const isInList = SERVICE_LIST.includes(input) !== -1;
	return isString && isInList;
};

const isServiceObject = (input) => {
	const isLiteralObject = input instanceof Object;
	// TODO :: need to type check or clear error message
	const hasEssentialProp = input.host !== undefined &&
		  input.port !== undefined &&
		  input.secure !== undefined;
	return isLiteralObject && hasEssentialProp;
};

const makeEmailer = (service = {}, auth) => {
	// TODO:: 이메일 테스트는 어떻게 만드는게 좋을까?
	let target = {};
	if(isServiceName(service)) {
		target.service = service;
	}else if(isServiceObject(service)) {
		target.host = service.host;
		target.port = service.port;
		target.secure = service.secure;
	}
	let transporter = nodemailer.createTransport({
		...target,
		auth
	});
	return {
		send: (option) => {
			transporter.sendMail(option, (error, info) => {
				if (error) {
					return console.log(error);
				}
				console.log('Message sent: %s', info.messageId);
				// Preview only available when sending through an Ethereal account
				console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
			});
		}
	};
};

module.exports = { makeEmailer };