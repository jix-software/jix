/*
 * app.js
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

package app;

// Start
function start(NOTNOW) {
  var PORT=conf().PORT || 80,
      SRV=server(PORT);

  for (var C of conf().CONT) {
    out("Loading "+C[0]),cr();
    container(C[0],conf().DATA+"/"+C[0],"db",SRV);
  }
  for (var MOD of conf().APP) {
    var JS=conf().PROJ+"/"+MOD,
        SRC=fileRead(JS).toString();
    out("Loading "+JS),cr();
    eval(SRC);
  }
  for (var C of conf().CONT) {
    var CONT=SRV.container(C[0]);
    for (FNAME of C[1]) {
      out("Setting method "+FNAME+"() of "+C[0]),cr();
      CONT.setQMethod(FNAME,origin[FNAME]);
    }
  }

  if (NOTNOW) return SRV; // FIXME: doesn't work
  out("Server started on port "+PORT+"...\n");
  SRV.start();
}

// Stop
function stop() {
  error("stop !Yet");
}
