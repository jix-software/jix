/*
 * files.js
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

// File error contexts
var SymbolLicol=Symbol("licol");
function licolSet(S,LI,COL,FNAME) {
  if (isUnboxed(S)) S=new String(S);
  S[SymbolLicol]={ LI:LI, COL:COL, FNAME:FNAME }; 
  return S;
}
function licol(S) {
  var LICOL;
  if (isBoxed(S)) LICOL=S[SymbolLicol];
  if (isUndefined(LICOL)) LICOL={ LI:-1, COL:-1, FNAME:Undefined }; 
  return LICOL;
}
function errlicolSet2(LICOL) { // FIXME: find a way to redefine errlicolSet() in a transparent way
  if (isString(LICOL)) LICOL=licol(LICOL);
  errlicolSet(LICOL.LI,LICOL.COL,LICOL.FNAME);
}

// Files
function fileExists(fname) {
  if (SERVER) return fs.existsSync(fname);
         else return httpSend("GET","http://localhost:8080/fileExists?"+fname); // FIXME: replace by a jix server call
}
function fileIsDir(fname) {
  var fd=fs.openSync(fname,"r");
  var stats=fs.fstatSync(fd);
  return stats.isDirectory();
}
function fileRead(fname,encoding/*FIXME: use this ; or remove it*/) {
  if (SERVER) {
    if (!fileExists(fname)) error("File not found: "+fname);
    var RES=fs.readFileSync(fname,"latin1"/*"ascii"*/);
    RES=Buffer.from(RES,"latin1").toString("utf8");
    return licolSet(RES,0,0,fname);
  }
  else return httpSend("GET","http://localhost:8080/"+fname); // FIXME: replace by a jix server call
}
function filePath(fname) {
//return path.dirname(fname);
  var a=fnameNormalize(fname).split("/"),s="";
  for (var i=0;i<length(a)-1;i++) {
    s+=a[i];
    if (i+2<length(a)) s+="/";
  }
  return s;
}
function fileName0(fname) {
  var a=fname.split("/");
  return a[length(a)-1];
}
function fileName(fname) {
  var a=fname.split(".");
  return fileName0(a[0]); //path.basename(a[0]);
}
function fileExt(fname) {
  var a=fname.split(".");
  return length(a)>1?a[length(a)-1]:Undefined;
}
function fileWrite(fname,str) {
  try {
    fs.writeFileSync(fname,str,"latin1"); // FIXME: convert back from UTF8 to Latin1 (is this necessary ? Decide a standard way to do it)
  }
  catch (err) {
    error("Can't write file: "+fname);
  }
}
function fileCopy(SRC,DEST) {
  if (SRC==DEST) return;
  var S=fileRead(SRC);
  fileWrite(DEST,S);
}
function fileDelete(fname) {
  fs.unlinkSync(fname);
}

// Directories
function dirCreate(fname) {
  try {
    fs.mkdirSync(fname);
  }
  catch (err) {
    error("Can't create directory: "+fname);
  }
}
function vfileCreate(fname,isDir,parent,val) {
//console.log("Loading "+fname);
  return {"fname":fname,"isDir":isDir,isModified:false,"val":val, "parent":parent};
}
_READ={};
function fileReadSet(ext,readFunc) {
  _READ[ext]=readFunc;
}
function dirRead(fname,mask,rec,alle) {
  function fileRead(fname) {
    var dir=path.dirname(fname)+"/";
    fname=path.basename(fname);
    var val="";
    var readFunc=_READ[fileExt(fname)];
    if (readFunc!=undefined) {
      val=readFunc(dir+fname);
      val=replaceAll(val,"\r\n","\n");
    }
    return val;
  }
  var predir=path.dirname(fname)+"/";
  fname=path.basename(fname);
  var d=vfileCreate(fname,true,null,{});
  var dir=fname;
  if (predir!="") dir=predir+"/"+fname;
  var a=fs.readdirSync(dir);
  for (var i=0;i<a.length;i++) {
    var b=fileIsDir(dir+"/"+a[i]);
    if (b) {
      if (rec) {
        d.val[a[i]]=dirRead(dir+"/"+a[i],mask,rec,alle);
        d.val[a[i]].parent=d;
      }
    }
    else {
      var matches=mask==undefined || endsWith(a[i],mask);
      if (alle || matches) d.val[a[i]]=vfileCreate(a[i],b,d,null);
      if (matches) d.val[a[i]].val=fileRead(dir+"/"+a[i]);
    }
  }
  return d;
}
function foreach_vfile(d,func) {
  for (var fname in d.val) {
    var f=d.val[fname];
    if (f.isDir) foreach_vfile(f,func);
            else func(f);
  }
  func(d);
}
function fnameNormalize(fname) {
  return replaceAll(path.resolve(path.normalize(fname)),"\\","/");
}
function vfilePathname(vf) {
  var a=[];
  do {
    a.push(vf.fname);
    vf=vf.parent;
  }
  while (vf!=null);
  return fnameNormalize(a.reverse().join("/"));
}
function isChildPath(p,parent) {
  p=path.normalize(p);
  parent=path.normalize(parent);
  if (parent[0]=="." && p[0]!='/') p="./"+p; //FIXME: Sort out all the other cases with "."
  return startsWith(p,parent);
}

// URLs
function urlParse(U) {
  var RES;
  if (SERVER) RES=url.parse(U);
         else RES=document.createElement('a'),RES.href=U;
  return RES;
}

// Console output ; TODO: Improve this and make it generic
var ColorNone           ="0",
    ColorBright         ="1",
    ColorNoBright       ="22",
    ColorUnderscore     ="4",
    ColorNoUnderscore   ="24",
    ColorBlink          ="5",
    ColorNoBlink        ="25",
    ColorReverse        ="7",
    ColorNoReverse      ="27";

var ColorBlack          ="30",
    ColorRed            ="31",
    ColorGreen          ="32",
    ColorBrown          ="33",
    ColorBlue           ="34",
    ColorMagenta        ="35",
    ColorCyan           ="36",
    ColorWhite          ="37",
    ColorGrey           ="b30",
    ColorBrightRed      ="b31",
    ColorBrightGreen    ="b32",
    ColorYellow         ="b33",
    ColorBrightBlue     ="b34",
    ColorBrightMagenta  ="b35",
    ColorBrightCyan     ="b36",
    ColorBrightWhite    ="b37";
    ColorBgBlack        ="40",
    ColorBgRed          ="41",
    ColorBgGreen        ="42",
    ColorBgBrown        ="43",
    ColorBgBlue         ="44",
    ColorBgMagenta      ="45",
    ColorBgCyan         ="46",
    ColorBgWhite        ="47";

var
   HTMLColor={}; // TODO: finish this
   HTMLColor[ColorBlack]="#000000",HTMLColor[ColorRed]="#FF0000";
   HTMLColor[ColorGreen]="#00FF00",HTMLColor[ColorBrown]="#800080";
   HTMLColor[ColorBlue]="#000080",HTMLColor[ColorMagenta]="#008080";
   HTMLColor[ColorCyan]="#0000FF",HTMLColor[ColorWhite]="#808080";

function htmlEscapeChars(html) {
  var res="";
  for (var i=0;i<html.length;i++) {
    var c=html[i];
    if (c=='<') c="&lt;";
    if (c=='>') c="&gt;";
    if (c=='&') c="&amp;";
    res+=c;
  }
  return res;
}
function htmlEscapeBlanks(html) {
  var res="";
  for (var i=0;i<html.length;i++) {
    var c=html[i];
    if (c=='\n') c="<br>";
    if (c==' ') c="<span style=\"white-space:pre-wrap;\"> </span>"; //"&nbsp;"; // TODO: Make the generated HTML code shorter (with an <spc> tag, styled with CSS)
    res+=c;
  }
  return res;
}

var OUTS=Nil;
function startOutS() {
  OUTS="";
}
function stopOutS() {
  OUTS=Nil;
}
function getOutS() {
  return OUTS;
}
function _out0(S) {
  if (!isString(S)) { console.log("<"+display(S)+">");error("out0"); }
  if (OUTS==Nil) if (SERVER) process.stdout.write(S); else document.write(S);
            else OUTS+=S; // FIXME: use an array instead, and join() it in flush()
}
function out0(S) {
  return _out0(S);
}
function _out(S) {
  if (SERVER || OUTS!=Nil) out0(S); else out0(htmlEscapeBlanks(htmlEscapeChars(S)));
}
function out(O) {
  return _out(O);
}
function outd(O) {
  out(display(O));
}
function br(s) {
  out0("<br>");
}
function hr(s) {
  out0("<hr>");
}

function esc(C) {
  if (SERVER) return "\x1b["+C+"m";
  else {
    C=HTMLColor[C];
    return C==undefined?"":"</font><font color=\""+C+"\">"; // FIXME: emit "</font>" exactly at the right time
  }
}
function color(C) {
  if (C[0]=="b") out0(esc(ColorBright)),C=substring(C,1,length(C));
            else out0(esc(ColorNoBright));
  out0(esc(C));
}
function cr() {
  out("\n");
}
function spc(N,C) {
  var RES="";
  if (isUndefined(C)) C=" ";
  while (N--) RES+=C;
  return RES;
}
function indent(N) {
  while (N--) out(" ");
}
var OUTINDENT=0;
function outIndent() {
  indent(OUTINDENT);
}
function outIndentInc(N) {
  OUTINDENT+=N;
}
function crIndent() {
  cr();
  outIndent();
}

function consoleInit() {
  ColorBlue=env("TERM")=="cygwin"?"37":"34"; // NOTE: Bug colors cygwin term ...
  ColorWhite=env("TERM")=="cygwin"?"34":"37";
}

// Environment
function env(VAR) {
  if (SERVER) return process.env[VAR]; else return "";
}

// Processes
function argvRemove(argv,j) {
  splice(argv,j,1,[]);
}
function processCwd() {
  return fnameNormalize(process.cwd());
}
function chdir(PATH) {
  return process.chdir(PATH);
}
function spawn(EXE,PARM) {
  function from(S,KEEP) {
    return Buffer.from(S).toString();
  }
  var RES=child_process.spawnSync(EXE,PARM);
  if (from(RES.stderr).length>0) {
    throw new Error(from(RES.stderr));
  }
  return from(RES.stdout).trim("\n");
}

// Init
var fs,path,url,child_process;
function filesInit() {
  if (SERVER) {
    fs=require('fs');
    path=require('path');
    url=require('url');
    child_process=require('child_process');
  }
  consoleInit();
}
