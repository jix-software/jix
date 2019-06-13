/*
 * songs.js
 *
 *   Copyright (C) Henri Lesourd 2019.
 *
 */

jix=require("./jixlib.js");

var SRV=jix.server(8081),
    C=jix.container("PopMusic","applications/songs/Songs","csv",SRV); // FIXME: detect the project's directory structure

console.log("Server started ...\n"); 
SRV.start();
