/*
 * server.js
 *
 *   Copyright (C) Henri Lesourd 2019.
 *
 */

jix=require("./jixlib.js");

var PORT=jix.conf().PORT || 80,
    SRV=jix.server(PORT),
    C=jix.container("PopMusic",jix.conf().DATA+"/songs","db",SRV);

console.log("Server started ...\n");
SRV.start();
