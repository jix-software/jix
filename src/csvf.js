/*
 * csvf.js
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

// Parsing
function csvparseObjVals(S) {
  var A=tokenize(S,True);
  if (length(A)==0) error("csvparseObjVals");
  var EXP="v",I=0,RES=[];
  while (I<length(A)) {
    if (EXP=="v") {
      var VAL="";
      while (I<length(A) && A[I]!=",") VAL+=A[I],I++;
      RES.push(VAL);
      EXP="s";
    }
    else {
      if (A[I]!=",") out(A[I]),error("csvparseObjVals(2)");
      I++;
      EXP="v";
      if (I>=length(A)) RES.push("");
    }
  }
  return RES;
}
function csvparseObj(S,TYPE,SLOT,CONT) {
  var A=csvparseObjVals(S),O={};
  if (length(A)!=length(SLOT)) out(display(A)),cr(),out(display(SLOT)),cr(),error("csvparse");
  for (var I=0;I<length(A);I++) {
    var VAL=A[I];
    if (length(VAL)>1 && VAL[0]=='"' && VAL[length(VAL)-1]=='"') VAL=trim(VAL,'"',True,True);
    O[SLOT[I]]=VAL;
  }
  return TYPE(O,CONT);
}
function csvparsef(S,CONT,TYPE) {
  csvparsefStart();
  var A=splitTrim(S,"\n"),RES=[];
  if (length(A)==0) error("csvparsef");
  var SLOT=splitTrim(A[0],","),
      TYNAME;
  for (var I=0;I<length(SLOT);I++) { // FIXME: unify addr's parsing with this syntax, and remove this code
    if (I==0) {
      var A2=splitTrim(SLOT[0],"||");
      if (length(A2)>1) TYNAME=A2[0],SLOT[0]=A2[1];
    }
    SLOT[I]=splitTrim(SLOT[I],":")[0];
  }
  if (isType(CONT)) TYPE=CONT,CONT=Undefined;
  if (isDefined(TYNAME) && isUndefined(TYPE)) {
    TYPE=type(Nil,{ NAME:TYNAME, PARENT:obj, ATTRS:SLOT });
  }
  if (isUndefined(TYPE)) error("csvparsef(2)");
  for (var I=1;I<length(A);I++) {
    if (length(A[I])==0) continue;
    RES.push(csvparseObj(A[I],TYPE,SLOT,CONT));
  }
  return RES;
}

function csvparsefStart() {
  charsInit();
  charnatSet("'",CharNatAlf);
  charnatSet("(",CharNatAlf); // FIXME: "," should be ALN, rather than doing this
  charnatSet(")",CharNatAlf);
  charnatSet("[",CharNatAlf); 
  charnatSet("]",CharNatAlf);
  charnatSet("?",CharNatAlf);
  charnatSet(".",CharNatAlf);
  charnatSet(";",CharNatAlf); // FIXME (END)
  charnatSet("!",CharNatAlf); // FIXME: as a default, all characters except "," should be Alf. Implement a real context for charnats in the tokenizer
  tokenizeStart(",");
  TOKENIZECOMMENTS=False;
}
