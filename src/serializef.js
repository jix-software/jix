/*
 * serializef.js
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

// Store
var _SFID,_SFOBJ;
function sfid(HIDDEN) {
  HIDDEN=isDefined(HIDDEN);
  return (HIDDEN?chr(1):chr(2))+_SFID++;
}
function sfisHiddenId(ID) {
  if (!isNumber(ID) && !isString(ID)) outd(ID),cr(),error("sfisHiddenId");
  return ID[0]==chr(1);
}
function sfisLocId(ID) {
  if (!isNumber(ID) && !isString(ID)) error("sfisLocId");
  return ID[0]==chr(1) || ID[0]==chr(2);
}
function sffetch(ID) {
  return _SFOBJ[ID];
}
function sfstore(O,HIDDEN) {
  if (isUnboxed(O)) return;
  var ID=O[SymbolId];
  if (isUndefined(ID)) ID=sfid(HIDDEN);
                  else if (isDefined(sffetch(ID))) return;
  O[SymbolId]=ID;
  _SFOBJ[ID]=O;
}
function sfrelease() {
  for (N in _SFOBJ) {
    if (sfisLocId(N)) delete sffetch(N)[SymbolId];
  }
}
function sfinit() {
  _SFID=0;
  _SFOBJ={};
  _SFOUT=[];
  _SFDONE={};
  _SFFIRST=True;
  _SFINDENT=0;
}

// Parse
var _SFSymbElt="ELT"+chr(2),_SFLANG;
function parsefList(L,I,STOP,CONT) {
// FIXME: implement (LI,COL) when error()
// TODO: implement a special treatment for types (i.e., configuring objects of type type according to the content of the object we parse)
// TODO: positionner les UP et resoudre les #
// TODO: parse int and keep strings ; pure symbols are also strings ; parse Nil, Unspec, and other atoms
// TODO: implement case-insensitive parsing for most slots, with slots actually stored in ucase
// TODO: implement case-configureable serializing for most slots
// TODO: implement parsing object of a type inheriting from an atomic type
/* TODO: implement parsing JSON-like syntax, and JSON-compatible syntax (with or without mix between attrs and array elements
                                                                         [ in the object (i.e. o{ A:1, B:2 | 3, 4, 5 }, qui est <=> a (o A=1 B=2 3 4 5)) */
  var N=length(L),FOUND=False,TYPE=array,RES=[],VAR=Undefined,ELT=Nil,TYNAME;
  function omg(S) {
    if (S=="(") return _SFLANG=="lisp"?S:"{";
    if (S==")") return _SFLANG=="lisp"?S:"}";
    if (S=="=") return _SFLANG=="lisp"?S:":";
    error("omg");
  }
  if (STOP==omg(")")) {
    TYPE=obj;
    var OBJ0=False;
    if (_SFLANG=="json" && L[I]=="{") I++,OBJ0=True;
    else
    if (I<N && strIsAlpha(L[I]) && (I+1>=N || I+1<N && L[I+1]!=omg("="))) {
      if (L[I]=="type") TYNAME=L[I];
                   else TYPE=type.getByName(L[I]);
      I++;
    }
    if (isUndefined(TYPE)) error("parsefList(1)-->"+I+" "+L[I]);
    if (_SFLANG=="json" && !OBJ0) if (L[I]!="{") error("parsefList(2)"); else I++;
    RES=obj({}); //TYPE({},isUndefined(TYNAME)?CONT:Undefined);
  }
  function parseval(VAR,VAL,TYELT) {
    if (isUndefined(TYELT)) TYELT=obj;
    if (!empty(TYPE.attrs())) {
      var A=TYPE.attr(VAR);
      if (A!=Nil) TYELT=A.TYPE;
    }
    if (TYELT==obj) {
      if (length(VAL)>=2 && VAL[0]=='"' && VAL[length(VAL)-1]=='"') TYELT=str;
      else ; // TODO: add other cases : recognize numbers, booleans, etc. in VAL
    }
    if (TYELT==bool) {
      if (VAL=="True") VAL=True;
      else
      if (VAL=="False") VAL=False;
                  else error("parseval(1)");
    }
    else
    if (TYELT==num) {
      ; // check VAL is a number
      VAL=JSON.parse(VAL);
    }
    else
    if (TYELT==str) VAL=substring(VAL,1,length(VAL)-1);
               else ;
    return VAL;
  }
  function pushvar(VAL) {
    if (isString(VAR)) if (syExists(VAR)) VAR=sy(VAR);
    if (strIsOmg(VAR)) error("pushvar(0)-->"+VAR);
    if (strIsOmg(VAL)) error("pushvar(1)-->"+VAL);
    if (STOP==omg(")")) {
      if (VAR==_SFSymbElt) ELT.push(VAL);
      else {
        var TYELT;
        if (VAR==sy("+o")) TYELT=num;
        VAL=parseval(VAR,VAL,TYELT);
        if (VAR==sy("+o")) RES.setId(VAL);
                      else RES[VAR]=VAL;
      }
      VAR=Undefined;
    }
    else RES.push(VAL);
  }
  var FIRST=True;
  while (I<N) {
    if (L[I]==STOP && (STOP==omg(")") || STOP=="]")) {
      FOUND=True,I++;
      break;
    }
    else {
      if (STOP==omg(")")) {
        if (_SFLANG=="json" && !FIRST) if (L[I]!=",") error("parsefList(3)"); else I++;
                                  else FIRST=False;
        if (I+1>=N || L[I+1]!=omg("=")) {
          VAR=_SFSymbElt;
          if (ELT==Nil) ELT=[];
        }
        else {
          VAR=L[I];
          I+=2;
          if (I>=N || L[I]==omg(")") || L[I]=="]") error("parsefList::Nothing after '='");
        }
      }
      if ((_SFLANG=="lisp" && L[I]==omg("("))
       || (_SFLANG=="json" && L[I]==omg("("))
       || (_SFLANG=="json" && L[I+1]==omg("(")) || L[I]=="[") {
        var A=parsefList(L,I+(_SFLANG=="lisp"?1:0),L[I]=="["?"]":omg(")"),CONT);
        pushvar(A[0]);
        I=A[1];
      }
      else pushvar(L[I]),I++;
    }
  }
  if (ELT!=Nil) VAR="$",pushvar(ELT);
  if (STOP!=omg(")") && STOP!="]" && FOUND) error("parsefList::STOP(1)");
  if ((STOP==omg(")") || STOP=="]") && !FOUND) error("parsefList::STOP(2)<"+STOP+">");
  if (TYNAME=="type") RES.PARENT=type.getByName(RES.PARENT),RES=type(Nil,RES);
  else
  if (TYPE!=obj && TYPE!=array) { // FIXME: still not good in this way, replaces the objects directly, while in fact the new object's content should be injected into the old object, to keep the pointers that point to it correct ; do all this in linkf() rather than creating directly in the container here
    RES=TYPE(RES);
    if (!isNil(CONT)) CONT.store(RES,RES.getId());
  }
  return [RES,I];
}
function parsef(S,CONT,LANG) {
  if (isString(CONT)) LANG=CONT,CONT=Undefined;
  if (isUndefined(LANG)) LANG="json";
  _SFLANG=LANG;
  if (LANG!="lisp" && LANG!="json") error("parsef(0)");
  parsefStart();
  var RES=parsefList(tokenize(S),0,"",CONT)[0];
  RES=linkf(RES,CONT);
  return RES;
}

function parsefStart() {
  charsInit();
  charnatSet("#",CharNatAlf);
  charnatSet("+",CharNatAlf);
  charnatSet("%",CharNatAlf);
  tokenizeStart("( ) [ ] { } = : ,");
}

// Serialize
var _SFOUT,_SFDONE,_SFFIRST,_SFINDENT;
function sfout(S) {
  _SFOUT.push(S);
  return S;
}
function sfresult() {
  return _SFOUT.join("");
}
function sfattrs(O) {
  return RES=Object.getOwnPropertyNames(O).concat(Object.getOwnPropertySymbols(O)).filter(function (X) {
               return X!=SymbolUp && X!=SymbolCont && X!="TO"/*FIXME: use SymbolTo, instead*/
             });
}
function serializefBis(O,MODE,MODES) {
// TODO: implement setting or not setting container id when displaying IDs
// TODO: implement serializing object of a type inheriting from an atomic type
/* TODO: implement adding links for external objects that are outside the border, including UP links
         only for those objects that are not pointed by PO links inside the group of objects we serialize.
         If one of these external objects has no ID, there is an error. */
// TODO: include flags ; do not include the container.
  var ISFIRST,SKIPSPC,SFSDONE;
  function sfslot(N,SMODE) {
    if (isUndefined(SMODE)) SMODE={};
    if (O.hasOwnProperty(N) && !(N==sy("+o") && sfisHiddenId(O[N]))) {
      if (!SKIPSPC) {
        if (_SFLANG=="json" && !ISFIRST) sfout(",");
        if (isDefined(SMODE["nl"])) sfout("\n"+spc(_SFINDENT));
                               else if (_SFLANG=="lisp") sfout(" ");
      }
      SKIPSPC=False;
      sfout(isSymbol(N)?sy(N):N),sfout(_SFLANG=="lisp"?"=":":");
      if (N==sy("+o")) sfout(O[N]);
              else serializefBis(O[N],MODE=="flat"?"symb":MODE,MODES);
      ISFIRST=False;
      SFSDONE[N]=1;
    }
  }
  if (isNil(O)) return sfout("Nil");
  if (isUndefined(O)) return sfout("Undef");
  if (isBoolean(O)) return sfout(O?"True":"False");
  if (isNumber(O)) return sfout(O.toString());
  if (isString(O)) return sfout('"'+strEscape(O)+'"'); // TODO: Strings containing no blanks are serialized as symbols
  if (isFunction(O)) return sfout('<Func>');
  if (isArray(O)) {
    ISFIRST=True;
    sfout("[");
    for (var I=0;I<length(O);I++) {
      if (ISFIRST) ISFIRST=False;
              else sfout(_SFLANG=="lisp"?" ":",");
      serializefBis(O[I],MODE=="flat"?"symb":MODE,MODES);
    }
    sfout("]");
  }
  else {
    if (typeOf(O).root()!=obj) out(pretty(O)),cr(),error("serializefBis(1)");
    if (MODE=="symb" && isUndefined(O[SymbolId])) error("serializefBis(undef ID)");
    if (isDefined(_SFDONE[O[SymbolId]]) || MODE=="symb") return sfout("#"+O[SymbolId]);
    sfstore(O,True);
    if (_SFLANG=="lisp") sfout("(");
    if (typeOf(O)!=obj) sfout(typeOf(O).name()); else SKIPSPC=True;
    if (_SFLANG=="json") sfout("{"),SKIPSPC=True;
    _SFINDENT+=2;
    SFSDONE={};
    ISFIRST=True;
    for (var I=0;I<length(MODES);I++) sfslot(MODES[I][0],MODES[I][1]);
    for (var N of sfattrs(O)) if (isUndefined(SFSDONE[N])) sfslot(N,{}); // FIXME: serialize UP if needed
    if (_SFLANG=="lisp") sfout(")");
                    else sfout("}");
    _SFINDENT-=2;
    if (isDefined(O[SymbolId])) _SFDONE[O[SymbolId]]=O;
  }
}
function serializefAllOfType(O,TYPE,MODE,MODES,SETID) { // TODO: have a special case with TYPE=="*"
  if (isUndefined(SETID)) SETID=False;
  if (isAtom(O) || isFunction(O)) return;
  if (isArray(O)) {
    for (var I=0;I<length(O);I++) {
      serializefAllOfType(O[I],TYPE,MODE,MODES,SETID);
    }
  }
  else
  if (typeOf(O).root()==obj) {
    if (SETID) sfstore(O);
    for (var N of sfattrs(O)) {
      if (!isAtom(O[N]) && !isArray(O[N]) && MODE!="full"/*TODO: take PO into account here*/) sfstore(O[N]);
    }
    if (!_SFDONE[O[SymbolId]] && (TYPE=="*" || typeOf(O)==TYPE)) {
      if (_SFFIRST) _SFFIRST=False;
               else sfout("\n")
      serializefBis(O,MODE,MODES);
    }
    for (var N of sfattrs(O)) {
      serializefAllOfType(O[N],TYPE,MODE,MODES,True);
    }
  }
  else error("serializeAllOfType(1)");
}
function serializef(O,FMT,LANG) {
  if (isAtom(O)) return JSON.stringify(O);
  sfinit();
  if (isUndefined(LANG)) LANG="json";
  _SFLANG=LANG;
  if (LANG!="lisp" && LANG!="json") error("serializef(0)");
  for (var I=0;I<length(FMT);I++) {
    var F=FMT[I],TYPE="*";
    if (F[0]!="*") TYPE=type.getByName(F[0]);
    if (isUndefined(TYPE)) error("serializef(1)");
    serializefAllOfType(O,TYPE,F[1],F[2]);
  }
  serializefAllOfType(O,"*","full",[]);
  sfrelease();
  return sfresult();
}

// Link
/* links the freshly parsed group of objects O, with all its incomplete objects/symbolrefs into CONT
   => the symbolrefs are replaced by all the existings objects into CONT when these objects exist
      otherwise, they are added into CONT ;
   => when an object exists and the corresponding symbolref exists into CONT, inject the object's
      content into the symbolref, relink the upper pointer to this symbolref ;
   => set the container of the objects ;
 */
function linkf(O,CONT) {
  return O;
}
