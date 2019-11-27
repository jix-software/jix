/*
 * multilingual.js
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

// Multilingual strings
var mlstr=type(function (VAL,LANG) {
                 var RES;
                 if (!isString(LANG)) LANG=mlstr.DEFAULT; // FIXME: we are ignoring the protocol for copy(), with parameters of the constructor that are containers
                 if (isString(VAL)) {
                   RES=mlstr.create(VAL);
                 }
                 else 
                 if (typeOf(VAL)==obj) { // TODO: move that at some point in the default init() of classes that inherit from JS atoms
                   if (isString(VAL.LANG)) LANG=VAL.LANG;
                   var VAL0=VAL.$;
                   if (isUndefined(VAL0) && isString(LANG)) VAL0=VAL[LANG];
                   if (isUndefined(VAL0)) VAL0="";
                   if (!isString(VAL0)) error("mlstr(1)");
                   RES=mlstr.create(VAL0);
                   RES.setAttrs(VAL);
                   delete RES.$;
                   if (isString(LANG)) delete RES[LANG];
                 }
                 else error("mlstr(2)");
                 RES.LANG=LANG;
                 return RES;
               },
               { "NAME":"mlstr", "PARENT":str, "ATTRS":[],
                 "LANGS":[], "TRANS":{}, "DEFAULT":"en", "LANG":"en" });

function isMLStr(O) {
  return isa(O,mlstr);
}

setprop(mlstr,"langs",function () {
  return mlstr.LANGS;
});
setprop(mlstr,"isLang",function (LANG) {
  return contains(mlstr.LANGS,LANG);
});
setprop(mlstr,"addLang",function (LANG) {
  mlstr.addLangs([LANG]);
});
setprop(mlstr,"addLangs",function (L) {
  for (var LANG of L) if (!mlstr.isLang(LANG)) {
    mlstr.LANGS.push(LANG);
    mlstr.TRANS[LANG]={};
  }
  mlstr.LANGS.sort(function (O1,O2) {
    return O1>O2;
  });
});
setprop(mlstr,"default",function () {
  return mlstr.DEFAULT;
});
setprop(mlstr,"setDefault",function (LANG) {
  if (!mlstr.isLang(LANG)) error("mlstr.setDefault");
  mlstr.DEFAULT=LANG;
});
setprop(mlstr,"lang",function () {
  return mlstr.LANG;
});
setprop(mlstr,"setLang",function (LANG) {
  if (!isString(LANG)) error("mlstr.setLang");
  mlstr.LANG=LANG;
});

mlstr.setMethod("toString",function (LANG) {
  if (isUndefined(LANG)) LANG=mlstr.LANG;
  if (!isString(LANG)) error("mlstr.toString");
  if (LANG==this.LANG) return this.valueOf();
                  else return this[LANG];
});

setprop(mlstr,"trans",function (S,LANG,LANG2) {
  if (!mlstr.isLang(LANG)) error("mlstr.trans(1)");
  if (isMLStr(S)) {
    if (isDefined(LANG2)) error("mlstr.trans(2)");
    var S2=S.toString(LANG);
    if (isDefined(S2)) return S2;
    S=S2;
  }
  if (!mlstr.isLang(LANG2)) error("mlstr.trans(3)");
  if (LANG==LANG2) return S;
  S=mlstr.TRANS[LANG][S];
  if (isUndefined(S)) return Undefined;
  return S.toString(LANG2);
});
setprop(mlstr,"setTrans",function (S,LANG,S2,LANG2) {
  if (isMLStr(S)) {
    if (isDefined(LANG) || isDefined(S2) || isDefined(LANG2)) error("mlstr.setTrans(1)");
    for (var LS of mlstr.LANGS) for (var LD of mlstr.LANGS) if (LS!=LD) {
      var SS=S.toString(LS),SD=S.toString(LD);
      if (isString(SS) && SS!="" && isString(SD) && SS!="") {
        mlstr.setTrans(SS,LS,SD,LD);
      }
    }
  }
  else {
    if (!isString(S) || !mlstr.isLang(LANG)
     || !isString(S2) || !mlstr.isLang(LANG2)) error("mlstr.setTrans(2)");
    var MS=mlstr.TRANS[LANG][S];
    if (isUndefined(MS)) MS=mlstr(S,LANG);
    if (MS.toString(LANG)!=S) error("mlstr.setTrans(3)");
    mlstr.TRANS[LANG][S]=MS;
    if (LANG2!=LANG) {
      if (isUndefined(mlstr.TRANS[LANG2][S2])) mlstr.TRANS[LANG2][S2]=MS; // Share the mlstr among indexes
      MS[LANG2]=S2;
    }
    else if (S!=S2) error("mlstr.setTrans(4)");
  }
});

mlstr.addLangs(["en","sp","de","fr","cn","pt","ar","ru"]);
