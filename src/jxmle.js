/*
 * jxmle.js
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

function jxmleTokenize(S) { // FIXME: use tokenize()
  var L=[],TOK="";
  for (var I=0;I<length(S);I++) {
    if (S[I]=="$") {
      I++;
      if (TOK!="") L.push(TOK);
      TOK="$";
      while (I<length(S) && (charIsLetter(S[I]) || charIsDigit10(S[I])) || S[I]=='_') TOK+=S[I],I++;
      L.push(TOK);
      TOK="";
      if (I<length(S)) I--;
    }
    else
    if (S[I]=="{" || S[I]=="}") {
      if (TOK!="") L.push(TOK);
      L.push(S[I]),TOK="";
    }
    else TOK+=S[I];
  }
  if (TOK!="") L.push(TOK);
  return L;
}

function jxmleEval(CTX,S) {
  var INJS=False;
  function ev(O,VAR) {
    if (INJS) return serialize(O);
    else {
      if (O==Nil) return ""; // TODO: check if we want that null objects are evaluated at "" in strings
      if (isNumber(O)) return serialize(O);
      if (isString(O) || isArray(O)/*FIXME: doesn't always work*/) return O;
      if (isBoolean(O)) return O?"1":"0";
      if (isDefined(VAR)) return VAR;
      error("jxmlEval.ev(!INJS)<<"+S+">>-->"+serialize(O)); // FIXME: add a way to embed pointers to full-blown objects without having to serialize them ; and unify completely the jxmle kind of eval with the eval of the event language
    }
  }
  if (!isString(S)) S=serialize(S);
  var L=jxmleTokenize(S);
  for (var I=0;I<length(L);I++) {
    if (L[I][0]=="{") INJS=1; // FIXME: improve this
    if (L[I][0]=="}") INJS=0;
    if (L[I][0]=="$" && CTX.hasOwnProperty(substring(L[I],1,length(L[I])))) {
      var VAR=substring(L[I],1,length(L[I]));
      L[I]=ev(CTX[VAR],VAR);
    }
  }
  var RES="";
  INJS=0;
  for (var I=0;I<length(L);I++) {
    if (L[I]=="{") {
      I++;
      var ES="",LEV=1,I0=I;
      while (I<length(L) && !(LEV==1 && L[I]=="}")) {
        ES+=L[I];
        if (L[I]=="{") LEV++;
        if (L[I]=="}") LEV--;
        I++;
      }
      if (L[I]!="}") error("jxmleEval(1)");
      if (LEV<1) error("jxmleEval(2)");
      var VAL=ev(eval(ES));
      if (I0==1 && I+1==length(L)) RES=VAL;
                              else RES+=VAL;
    }
    else RES+=L[I];
  }
  return RES;
}

function jxmleCollectJSNext(L,I) {
  if (L[I]!="{") error("jxmleCollectJS(1)");
  I++;
  var LEV=0;
  while (I<length(L)) {
    if (LEV==0 && L[I]=="}") break;
    if (L[I]=="{") LEV++;
    if (L[I]=="}") LEV--;
    I++;
  }
  if (L[I]!="}") error("jxmleCollectJS(2)");
  if (LEV<0) error("jxmleCollectJS(3)");
  return I;
}

function jxmleCollectJS(L,I0,I1) {
  var RES="";
  for (var I=I0; I<I1; I++) RES+=L[I];
  return RES;
}
