/*
	Rules-Engine
	NodeJS client
	2019-12-26, 2020-10-28, 2020-11-23 gbk

	Targets RE API v1
*/

//const https = require('https');
const fetch = require('node-fetch-retry');
var sessionToken = '';
var APIROOT = '';

const log4js = require('log4js');
var logger = log4js.getLogger('RulesEngine');
const esc = require('url-escape-tag');

function Configure(token,root) {
	sessionToken = token;
	APIROOT = root;
}

async function RERequest(Path) {

	if(Path.indexOf('?') != -1) {
		Path = Path + '&sessionToken='+sessionToken;
	} else {
		Path = Path + '?sessionToken='+sessionToken;
	}

	// return a promise
	/*
	return new Promise(function(complete) {

		// make the request
		const req = https.request(APIROOT+Path, (res) => {

			// when we get some data back, add it to the blob
			var ResponseData = '';
			res.on('data', (Data) => {
				ResponseData += Data;
			});

			// when the request is complete
			res.on('end', () => {

				// parse the response
				return complete(JSON.parse(ResponseData));
			});
		});

		req.on('error', (e) => {
			throw new Error(e);
		});

		req.end();
	});
	*/

	try {

		let error = false;
		// 2020-11-23; use node-fetch-retry
		let res = await fetch(APIROOT+Path, {
			method: 'GET',
			retry: 3,
			pause: 1000,
			callback: retry => { logger.warn(retry) }
		}).catch(e => {
			logger.error(e);
			error = true;
		});

		if(error) return null;

		return await res.json();

	} catch(e) {
		logger.error(e);
		return null;
	}
}

async function GetObject(ObjectType,ObjectKey) {
	return await RERequest(`Object/${ObjectType}/${ObjectKey}`);
}

async function Search(PropAPIName,Value) {
	return await RERequest(esc`PropVal/Search/${PropAPIName}/${Value}`);
}

async function ThingInfo(ThingKey) {
	return await RERequest(`Thing/Terse/${ThingKey}`);
}

async function ByUnique(PropAPIName,Value) {
	return await RERequest(esc`Thing/ByUnique/${PropAPIName}/${Value}`);
}

async function ByName(GroupKey,ThingName) {
	var Res = await RERequest(esc`Thing/ByName/${GroupKey}/${ThingName}`);
	return Res.Data[0];
}

async function ByType(TypeKey) {
	var Res = await RERequest(`Thing/ByType/${TypeKey}`);
	return Res.Data;
}

function CompileConstants(Properties) {
	if(!Properties.hasOwnProperty('ConstName')) {
		return {};
	}
	var Constants = {};
	for (var i = 0; i < Properties.ConstName.length; i++) {
		var Name = Properties.ConstName[i];
		var Value = Properties.ConstVal[i];
		Constants[Name] = Value;
	}
	return Constants;
}

async function AllThings(GroupKey) {
	return await RERequest(`Thing/All/${GroupKey}`);
}

async function GetChildren(ThingKey) {
	return await RERequest(`Thing/GetChildren/${ThingKey}?Effective=1&Tags=1`);
}

module.exports = {
	Configure,
	GetObject,
	Search,
	ThingInfo,
	ByUnique,
	ByName,
	CompileConstants,
	AllThings,
	GetChildren
};

