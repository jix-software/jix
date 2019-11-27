/*
 * projects.js
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

// Projects
var project=type(function (PATH,APPS,NOLINK) {
                   var RES=project.getBy("PATH",PATH);
                   if (RES==Nil) {
                     var RES=project.create();
                     RES.NAME=fileName(PATH);
                     RES.PATH=PATH;
                     if (!fileExists(PATH)) error("project()::Directory "+PATH+" does not exists");
                     if (!fileIsDir(PATH)) error("project()::File "+PATH+" is not a directory");
                     RES.CONF=confFetch(PATH);
                     project.$.push(RES);
                   }
                   return RES;
                 },
                 { "NAME":"project", "PARENT":obj,
                   "ATTRS":["NAME=''","PATH=''","CONF={}"] });

project.$=[];
setprop(project,"getBy",function (NAME,VAL) {
  var RES=Nil;
  for (var I in project.$) if (project.$[I][NAME]==VAL) RES=project.$[I];
  return RES;
});

function isProject(O) {
  return isa(O,project);
}

setprop(project,"cwp",function () {
  return project.CWP;
});
setprop(project,"setCwp",function (PROJ) {
  if (isDefined(PROJ) && !isProject(PROJ)) error("project.setCwp");
  project.CWP=PROJ;
});

project.setMethod("toDb",function (FNAME) {
//spawn("python",[IDIR+"/csv2db.py",FS.dir+"/"+FS.fname,F.dir+"/"+F.fname]);
  var CSV=csv.load(FNAME),
      TXT=CSV.toDb();
  fileWrite(filePath(FNAME)+"/"+fileName(FNAME)+".db",TXT);
});
project.setMethod("toHtml",function (FNAME) {
  var S=fileRead(FNAME),
      TYRES=[],
      TXT=jxml.toHtml(S,TYRES);
  if (TYRES[0]!="html") error("project.toHtml::jxml=>js !Yet");
  fileWrite(filePath(FNAME)+"/"+fileName(FNAME)+".html",TXT);
});

function ffname(S,CONF,LOC) {
  if (CONF[LOC]!=CONF.PROJ) S=substring(CONF[LOC],length(CONF.PROJ)+1,
                                                  length(CONF[LOC]))+"/"+fileName0(S);
  return S;
}
project.setMethod("build",function (LWEIGHT) {
  if (LWEIGHT) { // Lightweight build, meant to be used in servers, or in install scripts
    var DATA=fs.readdirSync(this.CONF.DATA),
        WEB=fs.readdirSync(this.CONF.WEB);
    for (var FNAME of DATA) if (fileExt(FNAME)=="csvh") {
      out("Loading "+ffname(FNAME,this.CONF,"DATA")),cr();
      csvh.load(this.CONF.DATA+"/"+FNAME);
    }
    for (var FNAME of DATA) if (fileExt(FNAME)=="csv") {
      out("Generating "+fileName(ffname(FNAME,this.CONF,"DATA"))+".db ..."),cr();
      this.toDb(this.CONF.DATA+"/"+FNAME);
    }
    for (var FNAME of WEB) if (fileExt(FNAME)=="jxml") {
      out("Generating "+fileName(ffname(FNAME,this.CONF,"WEB"))+".html ..."),cr();
      this.toHtml(this.CONF.WEB+"/"+FNAME);
    }
  }
  else {} // TODO: reunify this with the full-blown build which is currently in jix.prj
});

project.setMethod("release",function () { // FIXME: only works for fully unfolded projects with no first-class source code files
  var CONF=this.CONF,
      PROJ=fs.readdirSync(CONF.PROJ);
  function copy(FNAME) {
    out("Releasing "+FNAME+" ..."),cr();
    fileCopy(CONF.PROJ+"/"+FNAME,CONF.PROJ+"/release/"+FNAME,"binary");
  }
  if (fileExists(CONF.PROJ+"/release")) {
    if (!fileIsDir(CONF.PROJ+"/release")) error("File "+CONF.PROJ+"/release is not a directory");
  }
  else dirCreate(CONF.PROJ+"/release");
  if (contains(PROJ,"BOOT.ini")) copy("BOOT.ini");
  for (var FNAME of PROJ) if (fileExt(FNAME)=="js"
                            && !contains(["build","release"],fileName(FNAME))) copy(FNAME);
  for (var FNAME of PROJ) if (fileExt(FNAME)=="db") copy(FNAME);
  for (var FNAME of PROJ) if (contains(["html","css"],fileExt(FNAME))) copy(FNAME);
});

// Init
if (SERVER) {
  project.JIXPATH=env("JIX_HOME"); // TODO: normalize the names of all JIX standard pathnames
  if (isDefined(project.JIXPATH)) project.JIXPROJ=project(project.JIXPATH);
}
