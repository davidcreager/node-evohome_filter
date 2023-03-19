#!/usr/bin/env node
'use strict';
const util = require("util");
const nconf = require("nconf");
const mqtt = require('mqtt')


let configFileName = null;
if (process.argv.length > 2) {
	configFileName = process.argv[2];
} else {
	configFileName = "config.json"
}
//console.log("[startServer]\t\t\t argv length=" + process.argv.length + " fname=" +configFileName )
if (!configFileName.includes(".")) configFileName = configFileName + ".json"
if (!configFileName.includes("/")) configFileName = "./" + configFileName
console.log("[evohome_filter]\t Loading Configuaration from " + configFileName)
const config = nconf.file(configFileName).get().config;
const subs = config.subscriptions;
const inp_client  = mqtt.connect(config.inputMQTT);
const out_client  = mqtt.connect(config.outputMQTT);
console.log("[evohome_filter]\t input = " + config.inputMQTT + " output = " + config.outputMQTT + " subs =" + subs.join(", "))



inp_client.on('error', function (error) {
	console.log("[evohome_filter]\t Error received on " + config.inputMQTT, error);
	if (error.code == "ECONNREFUSED" && error.syscall == "connect") process.exit();
});

out_client.on('error', function (error) {
	console.log("[evohome_filter]\t Error received on " + config.outputMQTT, error);
	if (error.code == "ECONNREFUSED" && error.syscall == "connect") process.exit();
});

inp_client.on('connect', function () {
	console.log("[evohome_filter]\t Connected to " + config.inputMQTT);
	inp_client.subscribe(subs, function (err) {
		if (err) {
			console.error("[evohome_filter]\t Error in subscribing ", err)
		}
	})
});
out_client.on('connect', function () {
	console.log("[evohome_filter]\t Connected to " + config.outputMQTT);
})

inp_client.on('message', function (topic, message) {
  // message is Buffer
  if (config.debug) console.log(topic, message.toString())
  out_client.publish(topic, message, (err) => {if (err) console.log("[evohome_filter] Error in publishing ", err, topic, message)} );
})