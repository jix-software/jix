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
    SERIALIZING=False,
    _PRETTYID=0,
    PRETTYSTRID=0,PRETTYINDENT2=False; // TODO: reunify this later with the rest

var SymbolPrettyId=sy("pretty::+o")/*FIXME: this SHIT is buggy, it leaks*/,SymbolCont=sy("^$")/*FIXME: duplicate ; remove this asap*/;
function prettyGetId(O) {
  if (isDefined(O[SymbolPrettyId])) return O[SymbolPrettyId];
  if (isFunction(O.getId)) return O.getId();
  return "^^";
}
function prettyStrId(O) {
  if (PRETTYSTRID && length(O)>0) return "<"+prettyGetId(O)+">";
                             else return "";
}
function prettyStore(O) {
  O[SymbolPrettyId]=_PRETTYID++;
  _SERIALIZING.push(O);
}
function prettyFreeBufs() {
  if (isArray(_SERIALIZING)) {
    for (O in _SERIALIZING) if (isDefined(O[SymbolPrettyId])) delete O[SymbolPrettyId];
  }
  _SERIALIZING=[];
  _PRETTYID=0;
}
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
  if (isDate(O)) return 'd"'+O.toISOString()+'"';
  if (isFunction(O)) return '<Func>';
  if (contains(_SERIALIZING,O)) return "@"+prettyGetId(O);
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
    }
    if (isArray(O)) {
      prettyStore(O);
      RES+=prettyStrId(O)+"[";
      if (INDENT) incIndent(2);
      var PREVINDENT2=False;
      for (var I=0;I<length(O);I++) {
        if (INDENT) RES+="\n"+spc(SERIALIZEINDENT);
        var ISATOM=isAtom(O[I]) || isType(O[I]),
            ISUP=contains(_SERIALIZING,O[I]);
        if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
          incIndent(+2);
          if (!PREVINDENT2) RES+="\n"+spc(SERIALIZEINDENT);
        }
        RES+=prettyBis(O[I],MODE,SKIN);
        if (I+1<length(O)) RES+=",";
        if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
          if (I+1<length(O)) RES+="\n"+spc(SERIALIZEINDENT);
          incIndent(-2);
          PREVINDENT2=True;
        }
        else PREVINDENT2=False;
      }
      if (INDENT) incIndent(-2);
      RES+="]";
    //_SERIALIZING.pop();
    }
    else {
      prettyStore(O);
      var TYPE=typeOf(O),PATTERN=Nil;
      RES+=prettyStrId(O)+(TYPE==obj?"":TYPE.NAME)+"{";
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
      var PREVINDENT2=False;
      var FIRST=True,I=0,
          NAMES=Object.getOwnPropertyNames(O),LNAMES=length(NAMES),TRGI/*FIXME: horrible hack*/="";
      for (var NAME of NAMES/*.concat(Object.getOwnPropertySymbols(O))*//*FIXME: do a method allKeys() or something, for this ; FIXME(2): find a way to control OwnPropertySymbols() display via the skin or the mode */) {
        var MODE2=Undefined;
        if (PATTERN.hasOwnProperty(NAME)) MODE2=PATTERN[NAME];
        if (MODE2==Undefined) MODE2=PATTERN["*"];
        if (MODE2!=Undefined && !contains(MODE2[0],"-")) {
          var SA=contains(MODE2[0],"a"),
              SV=contains(MODE2[0],"v");
          if (!FIRST && (SA||SV)) RES+=",";
          RES+=TRGI,TRGI="";
          var VAL;
          if (NAME=="caller" || NAME=="callee" || NAME=="arguments") VAL="<Forbidden>";
                                                                else VAL=O[NAME];
          var ISATOM=(isAtom(VAL) || isType(VAL)) && !(isString(VAL) && length(VAL)>5) && !isDate(VAL),
              ISUP=contains(_SERIALIZING,VAL);
          if (SA||SV) {
            if (INDENT) RES+="\n"+spc(SERIALIZEINDENT);
            if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
              incIndent(+2);
              if (!PREVINDENT2) RES+="\n"+spc(SERIALIZEINDENT);
            }
            FIRST=False;
          }
          if (SA) RES+=isSymbol(NAME)?pretty(NAME):NAME;
          if (SA&&SV) RES+=":";
          if (SV) RES+=prettyBis(VAL,MODE2[1],SKIN,contains(MODE2[0],"i"));
          if (SA||SV) {
            if (PRETTYINDENT2 && !INDENT && !ISATOM && !ISUP) {
              if (I+1<LNAMES) TRGI+="\n"+spc(SERIALIZEINDENT);
              incIndent(-2);
              PREVINDENT2=True;
            }
            else PREVINDENT2=False;
            I++;
          }
        }
      }
      RES+=TRGI,TRGI="";
      if (INDENT) incIndent(-2);
      RES+="}";
    //_SERIALIZING.pop();
    }
  }  
  SERIALIZING=OSERIALIZING;
  return RES;  
}
function pretty(O,MODE,SKIN) { // Similar to JSON.stringify()
  var INDENT=False;
  if (MODE=="indent") MODE=Undefined,INDENT=True; // Hack (cf. PRETTYINDENT2)
  var OPRETTYINDENT2=PRETTYINDENT2;
  if (INDENT) PRETTYINDENT2=1;
  if (!SERIALIZING) _SERIALIZING=[];
  if (isUndefined(MODE)) MODE="short";
  var RES=prettyBis(O,MODE,SKIN);
  if (!SERIALIZING) prettyFreeBufs();
  PRETTYINDENT2=OPRETTYINDENT2;
  return RES;
}
