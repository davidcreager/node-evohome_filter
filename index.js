#!/usr/bin/env node
'use strict';
const util = require("util");
const nconf = require("nconf");



let configFileName = null;
if (process.argv.length > 2) {
	configFileName = process.argv[2];
} else {
	configFileName = "config.json"
}
//console.log("[startServer]\t\t\t argv length=" + process.argv.length + " fname=" +configFileName )
if (!configFileName.includes(".")) configFileName = configFileName + ".json"
if (!configFileName.includes("/")) configFileName = "./" + configFileName
console.log("[startServer]\t\t\t Loading Configuaration from " + configFileName)
const config = nconf.file(configFileName).get().config;


const mqtt = require('mqtt')
const inp_client  = mqtt.connect('mqtt://localhost')
const out_client  = mqtt.connect('mqtt://CREAGERS-WHS')

const subs = [
	"evohome/evogateway/+/+/relay_demand/#",
	"evohome/evogateway/+/+/heat_demand/#",
	"evohome/evogateway/+/+/system_fault/#"
	]

inp_client.on('error', function (error) {
	console.log("[evohome_filter] Error received - localhost", error);
	if (error.code == "ECONNREFUSED" && error.syscall == "connect") process.exit();
});

out_client.on('error', function (error) {
	console.log("[evohome_filter] Error received - creagers", error);
	if (error.code == "ECONNREFUSED" && error.syscall == "connect") process.exit();
});

inp_client.on('connect', function () {
	console.log("[evohome_filter] Connected to localhost");
	inp_client.subscribe(subs, function (err) {
		if (err) {
			console.error("[evohome_filter] Error in subscribing", err)
		}
	})
});
out_client.on('connect', function () {
	console.log("[evohome_filter] Connected to creagers");
})

inp_client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic, message.toString())
  out_client.publish(topic, message, (err) => {if (err) console.log("[evohome_filter] Error in publishing ", err, topic, message)} );
})