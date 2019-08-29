/*
 * conf.js
 *
 * Copyright (C) Henri Lesourd 2019.
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

// Conf
var _CONF={};
function conf() {
  return _CONF;
}

// Init
function confInit() {
  if (SERVER) {
    _CONF.CWD=processCwd();
    _CONF.PROG=fnameNormalize(process.argv[1]);
    _CONF.PROJ=filePath(_CONF.PROG);
    if (fileName0(_CONF.PROJ)=="bin" || fileName0(_CONF.PROJ)=="build") _CONF.PROJ=filePath(_CONF.PROJ);
    _CONF.SRC=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/src")) _CONF.SRC=_CONF.PROJ+"/src";
    _CONF.DATA=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/data")) _CONF.DATA=_CONF.PROJ+"/data";
    _CONF.BIN=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/bin")) _CONF.BIN=_CONF.PROJ+"/bin";
    _CONF.BUILD=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/build")) _CONF.BUILD=_CONF.PROJ+"/build";
    _CONF.CONF=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/conf")) _CONF.CONF=_CONF.PROJ+"/conf";
    _CONF.DOC=_CONF.PROJ;
    if (fileExists(_CONF.PROJ+"/doc")) _CONF.DOC=_CONF.PROJ+"/doc";
    if (fileExists(_CONF.CONF+"/BOOT.ini")) {
      var L=splitTrim(fileRead(_CONF.CONF+"/BOOT.ini"),"\n"),L2=[];
      for (var S of L) if (S!="" && S[0]!="#") L2.push(S);
      for (var S of L2) {
        var A=splitTrim(S,"=");
        if (length(A)!=2) error("confInit(1)");
        for (var S2 of ["CWD","PROG","PROJ","SRC","DATA","BIN","BUILD","CONF","DOC"]) {
          if (A[1]==S2) error("confInit::predef-->",S);
        }
        if (strIsNum(A[1])) A[1]=eval(A[1]); // FIXME: improve this, and have a way to have constructors for num, str, etc., that create unboxed values
        _CONF[A[0]]=A[1];
      }
    //out(pretty(_CONF)),cr();
    }
  }
}
