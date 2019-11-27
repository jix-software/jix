/*
 * init.js
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

var jix={
  error: error,
  isUndefined: isUndefined,
  type: type,
  boxit: boxit,
  parse: parse,
  serialize: serialize,
  memory: memory,
  length: length,
  trim: trim,
  splitTrim: splitTrim,
  contains: contains,
  mlstr: mlstr,
  filePath: filePath,
  fileName: fileName,
  fileRead: fileRead,
  fileWrite: fileWrite,
  fileCopy: fileCopy,
  dirRead: dirRead,
  foreach_vfile: foreach_vfile,
  out: out,
  outd: outd,
  cr: cr,
  consoleRepeat: consoleRepeat,
  processCwd: processCwd,
  spawn: spawn,
  pretty: pretty,
  api: api,
  server: server,
  container: container,
  conf: conf,
  test1: test1,
  tests: tests,
  start: start,
  init: function() { // FIXME: there's no real justification for all these init functions. Trash them.
    serversInit();
    containersInit();
    confInit(Nil,True);
    if (typeof JIXWEB!="undefined") {
      physdomInit();
      domInit();
    }
  },
  exportAll: function() { // FIXME: create a function declare() that does origin.X=X
    origin.Undefined=Undefined;
    origin.Nil=Nil;
    origin.True=True;
    origin.False=False;
    origin.error=error;
    origin.errorCatch=errorCatch;
    origin.type=type;
    origin.obj=obj;
    origin.setprop=setprop;
    origin.isa=isa;
    origin.isUndefined=isUndefined;
    origin.isNil=isNil;
    origin.isDefined=isDefined;
    origin.isBoolean=isBoolean;
    origin.isNumber=isNumber;
    origin.isString=isString;
    origin.isArray=isArray;
    origin.isType=isType;
    origin.isAtom=isAtom;
    origin.isObject=isObject;
    origin.substring=substring;
    origin.contains=contains;
    origin.index=index;
    origin.trim=trim;
    origin.splitTrim=splitTrim;
    origin.splice=splice;
    origin.parse=parse;
    origin.serialize=serialize;
    origin.length=length;
    origin.charIsLetter=charIsLetter;
    origin.charIsDigit10=charIsDigit10;
    origin.charsInit=charsInit;
    origin.charnat=charnat;
    origin.charnatSet=charnatSet;
    origin.CharNatAlf=CharNatAlf;
    origin.CharNatOmg=CharNatOmg;
    origin.CharNatQuote=CharNatQuote;
    origin.charIs=charIs;
    origin.charIsAlpha=charIsAlpha;
    origin.charIsBlank=charIsBlank;
    origin.strIsBlank=strIsBlank;
    origin.startsWith=startsWith;
    origin.endsWith=endsWith;
    origin.strMatch=strMatch;
    origin.replaceAll=replaceAll;
    origin.lcase=lcase;
    origin.ucase=ucase;
    origin.mlstr=mlstr;
    origin.filePath=filePath;
    origin.fileName=fileName;
    origin.fileName0=fileName0;
    origin.fileExt=fileExt;
    origin.fileRead=fileRead;
    origin.fileWrite=fileWrite;
    origin.fileCopy=fileCopy;
    origin.fileDelete=fileDelete;
    origin.dirCreate=dirCreate;
    origin.dirRead=dirRead;
    origin.foreach_vfile=foreach_vfile;
    origin.vfileCreate=vfileCreate;
    origin.urlParse=urlParse;
    origin.out=out;
    origin.outd=outd;
    origin.cr=cr;
    origin.outIndentInc=outIndentInc;
    origin.crIndent=crIndent;
    origin.startOutS=startOutS;
    origin.stopOutS=stopOutS;
    origin.getOutS=getOutS;
    origin.consoleMain=consoleMain;
    origin.consoleRepeat=consoleRepeat;
    origin.fileExists=fileExists;
    origin.fileIsDir=fileIsDir;
    origin.fnameNormalize=fnameNormalize;
    origin.processCwd=processCwd;
    origin.child_process=child_process;
    origin.spawn=spawn;
    origin.chdir=chdir;
    origin.pretty=pretty;
    origin.conf=conf;
    origin.confInit=confInit;
    origin.project=project;
    origin.server=server;
    origin.container=container;
    origin.tokenizeStart=tokenizeStart;
    origin.tokenize=tokenize;
    origin.format=format;
    origin.load=load;
    origin.save=save;
    origin.txtsave=txtsave;
    if (typeof JIXWEB!="undefined") {
      origin.markup=markup;
    }
    origin.csvparsef=csvparsef;
    origin.csvserializef=csvserializef;
    origin.csvh=csvh;
    origin.csv=csv;
    origin.start=start;
  }
};
