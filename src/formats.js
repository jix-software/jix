/*
 * formats.js
 *
 * Copyright (C) Henri Lesourd 2017, 2018, 2019.
 *
 *  This file is part of JIX.
 *
 *  JIX is free software: you can redistribute it and/or modify it under
 *  the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  JIX is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with JIX.  If not, see <http://www.gnu.org/licenses/>.
 */

// Formats
var format=type(function (EXT,TOKINIT) {
                  if (!isString(EXT)) error("format(1)");
                  var RES=format.getBy("EXT",EXT);
                  if (RES==Nil) {
                    var RES=format.create();
                    RES.EXT=EXT;
                    RES.TOKINIT=isUndefined(TOKINIT)?function (){
                      tokenizeStart("");
                    }:TOKINIT;
                    format.$.push(RES);
                  }
                  return RES;
                },
                { "NAME":"format", "PARENT":obj,
                  "ATTRS":["EXT=''","TOKINIT=Nil"] });

format.$=[];
setprop(format,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in format.$) if (format.$[I][NAME]==VAL) RES=format.$[I];
  return RES;
});

function isFormat(O) {
  return isa(O,format);
}

// Load
function load(FPATH,KEEP) {
  var TXT=fileRead(FPATH),
      EXT=fileExt(FPATH);
  if (!isString(EXT) || EXT=="") error("load(1)");
  var FMT=format.getBy("EXT",EXT);
  if (!isFormat(FMT)) error("load::format<"+EXT+"> doesn't exists");
  charsInit();
  FMT.TOKINIT();
  return tokenize(TXT,isDefined(KEEP));
}

// Save
function txtsave(TXT,N,SEP) { // TODO: add filtering comments (but not blanks)
  var PREVS="",RES="",I=0;
  for (var S of TXT) {
    if (isNumber(N) && I>=N) break;
    if (isDefined(SEP)) { if (N>0) RES+=SEP; }
                   else if (PREVS!="" && charIsAlpha(PREVS[0]) && S!="" && charIsAlpha(S[0])) RES+=" ";
    RES+=S;
    PREVS=S;
    I++;
  }
  return RES;
}
function save(FPATH,TXT) {
  if (isArray(TXT)) TXT=txtsave(TXT);
  fileWrite(FPATH,TXT);
}
