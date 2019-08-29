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
                 if (isString(VAL)) {
                   RES=mlstr.create(VAL);
                 }
                 else 
                 if (typeOf(VAL)==obj) { // TODO: move that at some point in the default init() of classes that inherit from JS atoms
                   var VAL0=VAL.$;
                   if (isUndefined(VAL0)) VAL0="";
                   if (!isString(VAL0)) error("mlstr(1)");
                   RES=mlstr.create(VAL0);
                   RES.setAttrs(VAL);
                   delete RES.$;
                   if (!isString(LANG)) LANG=RES.LANG;
                 }
                 else error("mlstr(2)");
                 if (!isString(LANG)) LANG=mlstr.DEFAULT; // FIXME: we are ignoring the protocol for copy(), with parameters of the constructor that are containers
                 RES.LANG=LANG;
                 return RES;
               },
               { "NAME":"mlstr", "PARENT":str, "ATTRS":[], "DEFAULT":"en", "LANG":"en" });

setprop(mlstr,"default",function () {
  return mlstr.DEFAULT;
});
setprop(mlstr,"setDefault",function (LANG) {
  if (!isString(LANG)) error("mlstr.setDefault");
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
