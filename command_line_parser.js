"use strict";

const COMMAND_LINE_OPTION = {
	API_KEY: "--api-key",
	EMAIL_TO: "--email-to",
	SAVE_PATH: "--save-path",
	ACCESS_TOKEN: "--access-token",
	REFRESH_TOKEN: "--refresh-token",
	CLIENT_ID: "--client-id",
	CLIENT_SECRET: "--client-secret"
};
const INVAILD_OPTION_VALUE_INSERTED_MESSAGE = (option, value) => {
	return `There is unexpected command line option form.\n option :: ${option}\nvalue :: ${value}`;
};

const commandLineOptionArray = Object.values(COMMAND_LINE_OPTION);

const isCommandLineOption = (couldBeOption) => {
	if(commandLineOptionArray.indexOf(couldBeOption) != -1) {
		return true;
	}
	return false;
};

const cloParse = (inputArgv) => {
	const insertedCLOption = {};
	const argv = inputArgv.copyWithin();
	
	while(argv.length != 0) {
		const couldBeOption = argv.shift();
		if(isCommandLineOption(couldBeOption)) {
			const value = argv[0];
			if(isCommandLineOption(value) || value === undefined || value.length == 0) {
				throw new Error(INVAILD_OPTION_VALUE_INSERTED_MESSAGE(couldBeOption, value));
			}
			insertedCLOption[couldBeOption] = value;
			// pop out, it already save in insertedCLOption
			argv.shift();
		}
	}
	return insertedCLOption;
};


module.exports = { COMMAND_LINE_OPTION, cloParse };