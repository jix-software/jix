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
function sfoid(O) {
  if (!contains(Object.getOwnPropertySymbols(O),SymbolId)) return Undefined;
  return O[SymbolId];
}
function sfstore(O,HIDDEN) {
  if (isUnboxed(O) || isRootAtom(O)) return;
  var ID=sfoid(O);
  if (isUndefined(ID)) ID=sfid(isAtom(O)?True:HIDDEN);
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
var _SFSymbElt="ELT"+chr(2),_SFLANG,ERRL,ERRI;
function parsefList(L,I,STOP,CONT) {
// FIXME: implement (LI,COL) when error()
/* TODO: implement a special treatment for types (i.e., configuring objects of type type according to
                                                                 [ the content of the object we parse) */
// TODO: positionner les UP et resoudre les #
// TODO: parse int and keep strings ; pure symbols are also strings ; parse Nil, Unspec, and other atoms
// TODO: implement case-insensitive parsing for most slots, with slots actually stored in ucase
// TODO: implement case-configureable serializing for most slots
// TODO: implement parsing object of a type inheriting from an atomic type
/* TODO: implement parsing JSON-like syntax, and JSON-compatible syntax (with or without mix
         between attrs and array elements in the object (i.e. o{ A:1, B:2 | 3, 4, 5 }, qui
         est <=> a (o A=1 B=2 3 4 5)) */
  var N=length(L),FOUND=False,TYPE=array,RES=[],ADDA={},VAR=Undefined,ELT=Nil,TYNAME;
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
      else {
        TYPE=type.getByName(L[I]);
        if (isUndefined(TYPE)) TYPE=type(Nil,{ NAME:L[I] }); // FIXME: find a way to automatically download the types
      }
      I++;
    }
    if (isUndefined(TYPE)) error("parsefList(1)-->"+I+" "+L[I]);
    if (_SFLANG=="json" && !OBJ0) if (L[I]!="{") error("parsefList(2)"); else I++;
    RES=obj({}); //TYPE({},isUndefined(TYNAME)?CONT:Undefined);
  }
  function unescape(S) {
    S=replaceAll(S,"\\\"",'"');
    S=replaceAll(S,"\\\'","'");
    S=replaceAll(S,"\\n","\n");
    S=replaceAll(S,"\r","");
    return S;
  }
  function parseval(VAR,VAL,TYELT) {
    if (isUndefined(TYELT)) TYELT=obj;
    if (isDefined(VAR) && (!isString(VAR) || !contains(VAR,".")) && !empty(TYPE.attrs())) {
      var A=TYPE.attr(VAR);
      if (A!=Nil) TYELT=A.TYPE;
    }
    if (TYELT==obj) {
      if (isString(VAL) && VAL!="" && strNumberLength(VAL,0)==length(VAL)) TYELT=num;
      else
      if (isString(VAL) && length(VAL)>=2 && VAL[0]=='"' && VAL[length(VAL)-1]=='"') {
        TYELT=str;
        if (length(VAL)>2 && strNumberLength(VAL,1)==length(VAL)-2) TYELT=num; // FIXME: hack ; .db files should have numbers written as numbers
      }
      else
      if (VAL=="Nil") VAL=Nil;
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
      if (length(VAL)>=2 && VAL[0]=='"' && VAL[length(VAL)-1]=='"') VAL=substring(VAL,1,length(VAL)-1); // FIXME: in .db files, in case there are numbers, probably they should strictly have the syntax of a number, not of a string containing a number
      if (strNumberLength(VAL,0)!=length(VAL)) error("parseval(num expected)<"+VAL+">");
      if (VAL[0]=="0") VAL=trim(VAL,"0",1,0); // FIXME: JSON.parse("01") doesn't parses to num(1), rather, it fails. Why ?
      if (VAL=="" || VAL[0]==".") VAL="0"+VAL; // FIXME: shouldn't we use eval() ?
      VAL=JSON.parse(VAL);
    }
    else
    if (TYELT==str || TYELT.inherits(str)) {
      if (SERVER) VAL=Buffer.from(eval(VAL.valueOf()),"latin1").toString("utf8"); /*needed to unescape \xyzs in VAL*/
             else VAL=unescape(substring(VAL,1,length(VAL)-1));
      if (TYELT!=str) VAL=TYELT(VAL);
    }
    return VAL;
  }
  function pushvar(VAL) {
    if (isString(VAR)) if (syExists(VAR)) VAR=sy(VAR);
    if (strIsOmg(VAR)) error("pushvar(0)-->"+VAR);
  //if (strIsOmg(VAL)) error("pushvar(1)-->"+VAL); // TODO: check all the case where we need, e.g. [!,a,b]
    if (STOP==omg(")")) {
      if (isString(VAR) && contains(VAR,".")) ADDA[VAR]=parseval(Undefined,VAL);
      else
      if (VAR==_SFSymbElt) ELT.push(parseval(Undefined,VAL));
      else {
        var TYELT;
        if (VAR==sy("+o")) TYELT=num;
        VAL=parseval(VAR,VAL,TYELT);
        if (VAR==sy("+o")) RES.setId(VAL);
                      else RES[VAR]=VAL;
      }
      VAR=Undefined;
    }
    else RES.push(parseval(Undefined,VAL));
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
        var A=parsefList(L,I+(_SFLANG=="lisp"||L[I]=="["?1:0),L[I]=="["?"]":omg(")"),CONT);
        pushvar(A[0]);
        I=A[1];
      }
      else {
        pushvar(L[I]),I++;
        if (_SFLANG=="json" && STOP=="]") if (L[I]==",") I++;
                                          else if (L[I]!="]") error("parsefList::']' expected");
      }
    }
  }
  if (ELT!=Nil) VAR="$",pushvar(ELT);
  if (STOP!=omg(")") && STOP!="]" && FOUND) error("parsefList::STOP(1)");
  if ((STOP==omg(")") || STOP=="]") && !FOUND) error("parsefList::STOP(2)<"+STOP+">");
  if (TYNAME=="type") RES.PARENT=type.getByName(RES.PARENT),RES=type(Nil,RES); // FIXME: quand on redefinit des types existants (tout specialement, des types comme obj()), il ne faut pas creer un nouveau type, mais fetcher le type de la memoire, et verifier qu'il a les bons attributs
  else
  if (TYPE!=obj && TYPE!=array) { // FIXME: still not good in this way, replaces the objects directly, while in fact the new object's content should be injected into the old object, to keep the pointers that point to it correct ; do all this in linkf() rather than creating directly in the container here
    RES=TYPE(RES);
    for (var N in ADDA) {
      var A=splitTrim(N,".");
      RES[A[0]][A[1]]=ADDA[N];
    }
    if (!isNil(CONT) && !isAtom(RES)) CONT.store(RES,RES.getId());
  }
  return [RES,I];
}
var ERRS;
function parsef(S,CONT,LANG) {
  if (isString(CONT)) LANG=CONT,CONT=Undefined;
  if (isUndefined(LANG)) LANG="json";
  _SFLANG=LANG;
  if (LANG!="lisp" && LANG!="json") error("parsef(0)");
  parsefStart();
  var RES=parsefList(tokenize(ERRS=S),0,"",CONT)[0];
  RES=linkf(RES,CONT);
  return RES;
}

function parsefStart() {
  charsInit();
  charnatSet("#",CharNatAlf);
  charnatSet("+",CharNatAlf);
  charnatSet("%",CharNatAlf);
  charnatSet(".",CharNatAlf);
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
               return X!=SymbolUp && X!=SymbolCont && X!="TO" /*FIXME: use SymbolTo, instead*/
                   && X!="length" && (!isNumStr(X) || !isAtom(O));
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
    if ((isAtom(O) && N=="$" || O.hasOwnProperty(N)) && !(N==sy("+o") && sfisHiddenId(O[N]))) {
      var NAME=isSymbol(N)?sy(N):N;
      if (contains(NAME,":")) return; // FIXME: Hack
      if (!SKIPSPC) {
        if (_SFLANG=="json" && !ISFIRST) sfout(",");
        if (isDefined(SMODE["nl"])) sfout("\n"+spc(_SFINDENT));
                               else if (_SFLANG=="lisp") sfout(" ");
      }
      SKIPSPC=False;
      sfout(NAME),sfout(_SFLANG=="lisp"?"=":":");
      if (N=="caller" || N=="callee" || N=="arguments") VAL="<Forbidden>";
      else
      if (isAtom(O) && N=="$") VAL=O.valueOf();
                          else VAL=O[N];
      if (N==sy("+o")) sfout(VAL);
                  else serializefBis(VAL,typeOf(VAL)==type?"name"
                                                          :MODE=="flat" && !isAtom(VAL)?"symb":MODE,MODES);
      ISFIRST=False;
      SFSDONE[N]=1;
    }
  }
  if (isNil(O)) return sfout("Nil");
  if (isUndefined(O)) return sfout("Undef");
  if (isBoolean(O)) return sfout(O?"True":"False");
  if (isNumber(O)) return sfout(O.toString());
  if (typeOf(O)==str) return sfout('"'+strEscape(O)+'"'); // TODO: Strings containing no blanks are serialized as symbols
  if (isFunction(O)) return sfout('<Func>');
  if (isArray(O)) {
    ISFIRST=True;
    sfout("[");
    for (var I=0;I<length(O);I++) {
      if (ISFIRST) ISFIRST=False;
              else sfout(_SFLANG=="lisp"?" ":",");
      serializefBis(O[I],typeOf(O[I])==type?"name":MODE=="flat" && !isAtom(VAL)?"symb":MODE,MODES);
    }
    sfout("]");
  }
  else {
    if (isRootAtom(O)) out(pretty(O)),cr(),error("serializefBis(1)");
    if (MODE=="symb" && isUndefined(sfoid(O))) error("serializefBis(undef ID)");
    var DEFINED=isDefined(_SFDONE[sfoid(O)]);
    sfstore(O,True);
    if (!DEFINED) _SFDONE[sfoid(O)]=O;
    if (MODE=="name") {
      if (!isFunction(O.name)) error("serializefBis(name)");
      return sfout(O.name());
    }
    if (DEFINED || MODE=="symb") return sfout("#"+sfoid(O));
    if (_SFLANG=="lisp") sfout("(");
    if (typeOf(O)!=obj) sfout(typeOf(O).name()); else SKIPSPC=True;
    if (_SFLANG=="json") sfout("{"),SKIPSPC=True;
    _SFINDENT+=2;
    SFSDONE={};
    ISFIRST=True;
    for (var I=0;I<length(MODES);I++) sfslot(MODES[I][0],MODES[I][1]);
    if (isAtom(O)) sfslot("$",{});
    for (var N of sfattrs(O)) if (isUndefined(SFSDONE[N])) sfslot(N,{}); // FIXME: serialize UP if needed
    if (_SFLANG=="lisp") sfout(")");
                    else sfout("}");
    _SFINDENT-=2;
  }
}
function serializefAllOfType(O,TYPE,MODE,MODES,SETID) { // TODO: have a special case with TYPE=="*"
  if (isUndefined(SETID)) SETID=False;
  if (isRootAtom(O) || isFunction(O)) return;
  if (typeOf(O).root()==obj && isDefined(_SFDONE[sfoid(O)])) return;
  if (isArray(O)) {
    for (var I=0;I<length(O);I++) {
      serializefAllOfType(O[I],TYPE,MODE,MODES,SETID);
    }
  }
  else {
    if (SETID) sfstore(O);
    for (var N of sfattrs(O)) {
      if (!isRootAtom(O[N]) && !isArray(O[N]) && MODE!="full"/*TODO: take PO into account here*/) sfstore(O[N]);
    }
    if (!_SFDONE[sfoid(O)] && (TYPE=="*" || typeOf(O)==TYPE)) {
      if (_SFFIRST) _SFFIRST=False;
               else sfout("\n")
      serializefBis(O,MODE,MODES);
    }
    for (var N of sfattrs(O)) {
      serializefAllOfType(O[N],TYPE,MODE,MODES,True);
    }
  }
}
function serializef(O,FMT,LANG) {
  if (isRootAtom(O)) return JSON.stringify(O);
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
  if (isArray(O)) { // FIXME: hack, somehow, to enable traversing graphs of objects while excluding arrays, and in the end, use O as an array to mean : "several objects", not an array to serialize.
    for (var I=0;I<length(O);I++) if (!_SFDONE[sfoid(O[I])]) {
      if (_SFFIRST) _SFFIRST=False;
               else sfout("\n")
      serializefBis(O[I],"full",[]);
    }
  }
  else serializefAllOfType(O,"*","full",[]);
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
