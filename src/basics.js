/*
 * basics.js
 *
 * Copyright (C) Henri Lesourd 2017, 2018.
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

// Basic constants
var Nil=null,
    Undefined=undefined;

var True=true,
    False=false;

// Error
var SERVER=(typeof window)=="undefined";
function stop(errno) {
  if (SERVER) process.exit(errno); else nofunc();
}
var ERRLI=-1,ERRCOL=-1,ERRFNAME=Nil;
function errlicolSet(LI,COL,FNAME) {
  if (LI>0) ERRLI=LI;
  if (COL>0) ERRCOL=COL;
  if (isDefined(FNAME)) ERRFNAME=FNAME;
}
function error(msg) {
  if (ERRFNAME!=Nil) msg+=" in "+ERRFNAME;
  if (ERRLI>0 || ERRCOL>0) msg+=" at (";
  if (ERRLI>0) msg+=ERRLI.toString();
  if (ERRCOL>0) {
    if (ERRLI>0) msg+=",";
    msg+=ERRCOL.toString();
  }
  if (ERRLI>0 || ERRCOL>0) msg+=")";
  (SERVER?console.log:alert)(msg);
  stop(1);
}

// JS types (1)
function prototype(X) {
  var RES=Object.getPrototypeOf(X);
  if (RES==Nil) return Object.prototype;
  return RES;
}
function constructor(X) {
  return prototype(X).constructor;
}
function isa0(O,C,REC) {
  if (isNil(O)) return False;
  if (constructor(O)==C) return True;
  if (isUndefined(REC)) REC=True;
  if (!REC || constructor(O)==Object) return False;
  return isa0(prototype(O),C,REC);
}

function eqNil(O) { return O===Nil; }
function isDefined(O) { return O!==Undefined; }
function isUndefined(O) { return O===Undefined; }
function isNil(O) { return isUndefined(O) || O==BoxedUndefined
                         || eqNil(O) || O==BoxedNil; }
function isSymbol(O) { return isa0(O,Symbol); }
function isBoolean(O) { return isa0(O,Boolean); }
function isNumber(O) { return isa0(O,Number); }
function isString(O) { return isa0(O,String); }
function isNumStr(O) { return isNumber(O) || strIsNum(O); }
function isAtom(O) { return isNil(O)
                          || isSymbol(O) || isBoolean(O)
                          || isNumber(O) || isString(O); }
function isRootAtom(O) { return typeOf(O).root()==typeOf(O) && isAtom(O); }
function isArray(O) { return isa0(O,Array); }
function isFunction(O) { return isa0(O,Function); }

// Symbols
var _SY={};
function sy(S) {
  if (isString(S)) { _SY[S]=1;return Symbol.for(S); }
  else
  if (isSymbol(S)) return Symbol.keyFor(S);
              else error("sy");
}
function syExists(S) {
  return isDefined(_SY[S]);
}

// Characters
var CharNatNone=0,CharNatUnknown=CharNatNone,
    CharNatAlf=1,CharNatQuote=2,CharNatDQuote=3,
    CharNatOmg=4,CharNatDigit=5,CharNatBlank=6
var CharNat=[];

function asc(c) {
  return c.codePointAt(0);
}
function chr(i) {
  return String.fromCharCode(i);
}
function charnat(c) {
  return CharNat[asc(c)];
}
function charnatSet(c,n) {
  return CharNat[asc(c)]=n;
}
function charIsLetter(C) {
  return asc(C)>=asc("A") && asc(C)<=asc("Z")
      || asc(C)>=asc("a") && asc(C)<=asc("z");
}
function charIsDigit10(C) {
  return asc(C)>=asc("0") && asc(C)<=asc("9");
}
function charIsXDigit(C) {
  return charIsDigit10(C) || (asc(C)>=asc('A') && asc(C)<=asc('F')) || (asc(C)>=asc('a') && asc(C)<=asc('f'));
}
function charIsDigitInRadix(C,RADIX) {
  if (RADIX<2 || RADIX>16) error("charIsDigitInRadix");
  if (RADIX<=10) return charIsDigit10(C) && asc(C)<=asc('0')+RADIX-1;
  return charIsDigit10(C) || (charIsXDigit(C) && ((asc(C)>=asc('A') && asc(C)<=asc('A')+RADIX-11)
                                               || (asc(C)>=asc('a') && asc(C)<=asc('a')+RADIX-11)));
}
function charIsAlpha(C) {
  return charnat(C)==CharNatAlf;
}
function charIsOmg(C) {
  return charnat(C)==CharNatOmg;
}
function charIsDigit(C) {
  return charnat(C)==CharNatDigit;
}
function charIsBlank(C) {
  return charnat(C)==CharNatBlank;
}
function charIsUnknown(C) {
  return charnat(C)==CharNatUnknown;
}
function charIs(C,N) {
  return charnat(C)==N;
}
function strIs(S,N) {
  if (!isString(S) || length(S)==0) return False;
  for (var I=0;I<length(S);I++) if (!charIs(S[I],N)) return False;
  return True;
}
function strIsAlpha(S) { // FIXME: check all chars (and verify that everywhere its used, the change is ok)
  return strIs(S,CharNatAlf);
}
function strIsOmg(S) {
  return strIs(S,CharNatOmg);
}
function strIsNum(S) {
  return strIs(S,CharNatDigit);
}
function strIsBlank(S) {
  return strIs(S,CharNatBlank);
}

function charsInit() {
  var i;
  for (i=0;i<256;i++) CharNat[i]=CharNatNone;
  for (i=32;i<=126;i++) CharNat[i]=CharNatOmg;
  for (i=asc('A');i<=asc('Z');i++) CharNat[i]=CharNatAlf;
  for (i=asc('a');i<=asc('z');i++) CharNat[i]=CharNatAlf;
  for (i=192;i<=255;i++) CharNat[i]=CharNatAlf;
  CharNat[asc('"')]=CharNatDQuote;
  CharNat[asc('\'')]=CharNatQuote; // These two ones to cut at beginning of a string
  CharNat[asc('_')]=CharNatAlf;
  CharNat[asc('$')]=CharNatAlf;
  for (i=asc('0');i<=asc('9');i++) CharNat[i]=CharNatDigit;
  CharNat[asc("\t")]=CharNatBlank;
  CharNat[asc(" ")]=CharNatBlank;
  CharNat[asc("\n")]=CharNatBlank;
  CharNat[asc("\r")]=CharNatBlank;
}

// Strings
function trim(s,chars,left,right) {
  if (chars==undefined) chars=" ";
  if (left==undefined) left=true;
  if (right==undefined) right=true;
  var res="",a=s.split(""),i;
  if (left) {
    i=0;
    while (i<a.length && chars.indexOf(a[i])!=-1) {
      a[i]=null;
      i++;
    }
  }
  if (right) {
    i=a.length-1;
    while (i>=0 && chars.indexOf(a[i])!=-1) {
      a[i]=null;
      i--;
    }
  }
  for (i=0;i<a.length;i++) if (a[i]!=null) res+=a[i];
  return res;
}
function startsWith(s,i,pref) {
  if (s.length-i<pref.length) return false;
  else {
    return substring(s,i,pref.length)==pref;
  }
}
function endsWith(s,suff) {
  if (s.length<suff.length) return false;
  else {
    return substring(s,s.length-suff.length,s.length)==suff;
  }
}
function strFind(s,ss) {
  for (var i=0;i<s.length;i++) {
    if (startsWith(substring(s,i,s.length),0,ss)) return i;
  }
  return -1;
}
function strMatch(S,PATTERN) {
  var A=PATTERN.split("*");
  if (length(A)==1) return S==PATTERN;
  if (length(A)==2) {
    if (A[0]=="" && A[1]=="") return True;
    if (A[0]=="") return endsWith(S,A[1]);
    if (A[1]=="") return startsWith(S,0,A[0]);
    if (length(A[0])>length(S) || length(A[1])>length(S)) return False;
    return startsWith(S,0,A[0]) && endsWith(substring(S,length(A[0]),length(S)),A[1]);
  }
  if (length(A)==3) {
    if (A[0]=="" && A[1]=="" && A[2]=="") return True;
    if (A[0]=="" && A[1]!="" && A[2]=="") return strFind(S,A[1])!=-1;
  }
  error("strMatch");
}
function substring(S,I0,I1) {
  return S.substring(I0,I1);
}
function splitTrim(s,chars) {
  var a=s.split(chars);
  for (var i=0;i<a.length;i++) a[i]=trim(a[i]," \r\n",true,true);
  return a;
}
function splitOnce(S,SEP,DFLT) {
  var A=splitTrim(S,SEP),RES=[DFLT[0],DFLT[1]];
  if (length(A)==0) error("splitOnce");
  if (length(A)==1) if (isUndefined(DFLT[0])) RES[0]=S; else RES[1]=S;
  else {
    RES[0]=A[0];
    RES[1]=substring(S,length(A[0])+length(SEP),length(S));
  }
  return RES;
}
function replaceAll(s,s1,s2) {
  var s0;
  do {
    s0=s;
    s=s.replace(s1,s2);
  }
  while (s!=s0);
  return s; 
}
function lcase(s) {
  return s.toLowerCase();
}
function ucase(s) {
  return s.toUpperCase();
}
function count(S,CHARS,I0,ATBEG) {
  var RES=0;
  if (isUndefined(I0)) I0=0;
  for (var i=I0;i<length(S);i++) {
    var FOUND=False;
    for (var j=0;j<length(CHARS);j++) {
      if (CHARS=="" || S[i]==CHARS[j]) { RES++;FOUND=True;break; }
    }
    if (!FOUND && ATBEG) break;
  }
  return RES;
}
function explode(S) {
  if (!isUndefined(S) && !isString(S)) error("explode");
  var RES=[];
  if (isDefined(S)) for (var I=0;I<length(S);I++) RES[I]=S[I];
  return RES;
}
function implode(A) {
  if (isString(A)) return A;
  if (!isArray(A)) error("implode");
  var RES="";
  for (var I=0;I<length(A);I++) RES+=A[I]; // FIXME: check the type of A[I] properly
  return RES;
}

// Arrays
function arrayN(N,VAL) {
  var A=[];
  while (N--) A.push(VAL);
  return A;
}
function length(o) {
  if (isString(o) || isArray(o)) return o.length;
  else
  if (isAtom(o)) return 0;
            else return Object.getOwnPropertyNames(o).length;
}
function empty(st) {
  return length(st)==0;
}
function last(st) { // TODO: Shit, top(), is already defined. Find a way to have it, or another decent name
  if (empty(st)) return null;
  return st[st.length-1];
}
function contains(a,o,weak) {
  if (isString(a)) return strFind(a,o)!=-1;
  else
  if (isArray(a)) {
    for (var i=0;i<a.length;i++) if (weak?a[i]==o:a[i]===o) return true;
  }
  else out(display(a)),error("contains");
  return false;
}
function containsVal(a,o) {
  return contains(a,o,True);
}
function index(a,o) {
  for (var i=0;i<a.length;i++) if (a[i]===o) return i;
  return -1;
}
function find(a,o,data) {
  for (var i=0;i<a.length;i++) {
    if (!data && o(a[i]) || data && (isNil(o)?a[i]===o:a[i]==o)) return a[i];
  }
  return Undefined;
}
function arrayToDict(a) {
  var d={};
  for (var i=0;i<a.length;i++) if (a[i]!=null) d[a[i][0]]=a[i][1];
  return d;
}
function splice(t,i,ndel,t2) {
  t.splice.apply(t,[i,ndel].concat(t2));
}
function acopy(A,I0,I1) {
  var RES=arrayN(I1-I0);
  for (var I=I0;I<I1;I++) RES[I-I0]=A[I];
  return RES;
}
function sort(A,SLOTS) {
  if (isUndefined(SLOTS) || isString(SLOTS) && length(SLOTS)==0) return A;
  if (!isString(SLOTS)) error("sort"); // TODO: implement multislot sorting
  var SIGN=+1;
  if (SLOTS[0]=="+" || SLOTS[0]=="-") {
    SIGN=SLOTS[0]=="+"?+1:-1;
    SLOTS=substring(SLOTS,1,length(SLOTS));
    if (length(SLOTS)==0) error("sort(2)");
  }
  A.sort(function (O1,O2) {
    return O1[SLOTS]>O2[SLOTS]?SIGN:-SIGN;
  });
  return A;
}

// Display
function strEscape(s) {
  var res="";
  for (var i=0;i<s.length;i++) {
    var c=s[i];
    if (c=='"') c="\\\"";
    if (c=='\n') c="\\n";
    res+=c;
  }
  return res;
}
var displaying=[],display_mode="cooked";
function displayMode(mode) {
  display_mode=mode;
}
function display(o) { // Similar to JSON.stringify()
  var res=null;
  if (isUndefined(o)) res="Undefined";
  else
  if (isNil(o)) res="Nil";
  else
  if (isBoolean(o)) res=o.toString();
  else
  if (isNumber(o)) res=o.toString();
  else
  if (isString(o)) {
  /*if (display_mode=="raw")*/ res=o;
    if (display_mode=="cooked") res='"'+strEscape(o)+'"';
  }
  else
  if (isSymbol(o)) res=o.toString();
  else
  if (isFunction(o)) res="<JSFunc>";
  else
  if (contains(displaying,o)) res="^^";
  else
  if (isArray(o)) {
    displaying.push(o);
    res="[";
    for (var i=0;i<o.length;i++) {
      if (i>0) res+="|";
      res+=display(o[i]);
    }
    res+="]";
    displaying.pop();
  }
  else {
    displaying.push(o);
    res="{";
    var first=true;
    for (var val in o) {
      if (!first) res+="|"; else first=false;
      if (val!="parent") {
        res+=val+"="+display(o[val]);
      }
    }
    res+="}";
    displaying.pop();
  }
  return res;
}

// Origin
var origin;
if (SERVER) origin=global;
       else origin=window;

// Init
function basicsInit() {
  charsInit();
}
