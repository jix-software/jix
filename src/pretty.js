/*
 * pretty.js
 *
 * Copyright (C) Henri Lesourd 2018, 2019.
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

var _SERIALIZING=[],
    SERIALIZEINDENT=0,
    SERIALIZING=False;

function prettyBis(O,MODE,SKIN,INDENT) {
  if (INDENT==Undefined) INDENT=False;
  var OSERIALIZING=SERIALIZING;
  if (isFunction(MODE)) return MODE(O);
  if (isType(O)) return O.NAME; // TODO: see how to deal with that, in case we want to display types' content anyway
  if (isNil(O)) return "Nil";
  if (isUndefined(O)) return "Undef";
  if (isBoolean(O)) return O?"True":"False";
  if (isNumber(O)) return O.toString();
  if (isSymbol(O)) return isUndefined(sy(O))?O.toString():sy(O);
  if (isString(O)) return '"'+strEscape(O)+'"';
  if (isFunction(O)) return '<Func>';
  if (contains(_SERIALIZING,O)) {
    if (isFunction(O.getId)) return "@"+O.getId();
                        else return "@^^";
  }
  SERIALIZING=True;
  var RES="";
  if (MODE=="name") {
    if (isArray(O)) RES="[...]";
    else {
      var NAME=O.NAME;
      if (!isUndefined(NAME)) RES=NAME;
                         else RES="{...}";
    }
  }
  else {
    function incIndent(N) {
      SERIALIZEINDENT+=N;
      OUTINDENT=SERIALIZEINDENT;
    }
    if (isArray(O)) {
      _SERIALIZING.push(O);
      RES+="[";
      if (INDENT) incIndent(2);
      for (var I=0;I<length(O);I++) {
        if (I>0) RES+=",";
        if (INDENT) RES+="\n"+spc(SERIALIZEINDENT);
        RES+=prettyBis(O[I],MODE,SKIN);
      }
      if (INDENT) incIndent(-2);
      RES+="]";
    //_SERIALIZING.pop();
    }
    else {
      _SERIALIZING.push(O);
      var TYPE=typeOf(O),PATTERN=Nil;
      RES+=(TYPE==obj?"":TYPE.NAME)+"{";
      if (SKIN!=Undefined) {
        var SKINT=SKIN[TYPE.NAME];
        if (isUndefined(SKINT)) SKINT=SKIN["*"];
        if (SKINT!=Undefined) {
          if (MODE==Undefined) MODE=SKINT["default"];
          if (MODE!=Undefined) PATTERN=SKINT[MODE];
        }
      }
      if (MODE==Undefined) MODE="short"; // FIXME: unused
      if (isNil(PATTERN)) PATTERN={"*":["av","full"]};
      if (INDENT) incIndent(2);
      var FIRST=True;
      for (var NAME of Object.getOwnPropertyNames(O)/*.concat(Object.getOwnPropertySymbols(O))*//*FIXME: do a method allKeys() or something, for this ; FIXME(2): find a way to control OwnPropertySymbols() display via the skin or the mode */) {
        var MODE2=Undefined;
        if (PATTERN.hasOwnProperty(NAME)) MODE2=PATTERN[NAME];
        if (MODE2==Undefined) MODE2=PATTERN["*"];
        if (MODE2!=Undefined && !contains(MODE2[0],"-")) {
          var SA=contains(MODE2[0],"a"),
              SV=contains(MODE2[0],"v");
          if (!FIRST && (SA||SV)) RES+=",";
          if (SA||SV) if (INDENT) RES+="\n"+spc(SERIALIZEINDENT);
          if (SA||SV) FIRST=False;
          if (SA) RES+=isSymbol(NAME)?pretty(NAME):NAME;
          if (SA&&SV) RES+="=";
          if (SV) {
            var VAL;
            if (NAME=="caller" || NAME=="callee" || NAME=="arguments") VAL="<Forbidden>";
                                                                  else VAL=O[NAME];
            RES+=prettyBis(VAL,MODE2[1],SKIN,contains(MODE2[0],"i"));
          }
        }
      }
      if (INDENT) incIndent(-2);
      RES+="}";
    //_SERIALIZING.pop();
    }
  }  
  SERIALIZING=OSERIALIZING;
  return RES;  
}
function pretty(O,MODE,SKIN) { // Similar to JSON.stringify()
  if (!SERIALIZING) _SERIALIZING=[];
  if (isUndefined(MODE)) MODE="short";
  var RES=prettyBis(O,MODE,SKIN);
  if (!SERIALIZING) _SERIALIZING=[];
  return RES;
}
