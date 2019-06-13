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
  isUndefined: isUndefined,
  type: type,
  boxit: boxit,
  parse: parse,
  serialize: serialize,
  memory: memory,
  out: out,
  cr: cr,
  pretty: pretty,
  api: api,
  server: server,
  container: container,
  test1: test1,
  tests: tests,
  init: function() { // FIXME: there's no real justification for all these init functions. Trash them.
    basicsInit();
    filesInit();
    serversInit();
    containersInit();
  }
};
