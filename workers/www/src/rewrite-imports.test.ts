import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rewriteImports } from "./rewrite-imports.ts";

describe("rewriteImports", () => {
  it('rewrites `import React from "react";`', () => {
    let result = rewriteImports('import React from "react";', "https://unpkg.com", { react: "15.6.1" });
    assert.equal(result, 'import React from "https://unpkg.com/react@15.6.1?module";');
  });

  it('rewrites `import router from "@angular/router";`', () => {
    let result = rewriteImports('import router from "@angular/router";', "https://unpkg.com", {
      "@angular/router": "4.3.5",
    });
    assert.equal(result, 'import router from "https://unpkg.com/@angular/router@4.3.5?module";');
  });

  it('rewrites `import map from "lodash.map";`', () => {
    let result = rewriteImports('import map from "lodash.map";', "https://unpkg.com", { "lodash.map": "4.6.0" });
    assert.equal(result, 'import map from "https://unpkg.com/lodash.map@4.6.0?module";');
  });

  it('rewrites `import fs from "pn/fs";`', () => {
    let result = rewriteImports('import fs from "pn/fs";', "https://unpkg.com", { pn: "1.0.0" });
    assert.equal(result, 'import fs from "https://unpkg.com/pn@1.0.0/fs?module";');
  });

  it('rewrites `import cupcakes from "./cupcakes";`', () => {
    let result = rewriteImports('import cupcakes from "./cupcakes";', "https://unpkg.com", {});
    assert.equal(result, 'import cupcakes from "./cupcakes?module";');
  });

  it('rewrites `import shoelaces from "/shoelaces";`', () => {
    let result = rewriteImports('import shoelaces from "/shoelaces";', "https://unpkg.com", {});
    assert.equal(result, 'import shoelaces from "/shoelaces?module";');
  });

  it('does not rewrite `import something from "//something.com/whatevs";`', () => {
    let result = rewriteImports('import something from "//something.com/whatevs";', "https://unpkg.com", {});
    assert.equal(result, 'import something from "//something.com/whatevs";');
  });

  it('does not rewrite `import something from "http://something.com/whatevs";`', () => {
    let result = rewriteImports('import something from "http://something.com/whatevs";', "https://unpkg.com", {});
    assert.equal(result, 'import something from "http://something.com/whatevs";');
  });

  it('does not rewrite `let ReactDOM = require("react-dom");`', () => {
    let result = rewriteImports('let ReactDOM = require("react-dom");', "https://unpkg.com", {});
    assert.equal(result, 'let ReactDOM = require("react-dom");');
  });

  it('rewrites `export { default as React } from "react";`', () => {
    let result = rewriteImports('export { default as React } from "react";', "https://unpkg.com", { react: "15.6.1" });
    assert.equal(result, 'export { default as React } from "https://unpkg.com/react@15.6.1?module";');
  });

  it('rewrites `export { Component } from "react";`', () => {
    let result = rewriteImports('export { Component } from "react";', "https://unpkg.com", { react: "15.6.1" });
    assert.equal(result, 'export { Component } from "https://unpkg.com/react@15.6.1?module";');
  });

  it('rewrites `export * from "react";`', () => {
    let result = rewriteImports('export * from "react";', "https://unpkg.com", { react: "15.6.1" });
    assert.equal(result, 'export * from "https://unpkg.com/react@15.6.1?module";');
  });

  it('does not rewrite `export var message = "hello";`', () => {
    let result = rewriteImports('export var message = "hello";', "https://unpkg.com", {});
    assert.equal(result, 'export var message = "hello";');
  });

  it('rewrites `import("./something.js");`', () => {
    let result = rewriteImports('import("./something.js");', "https://unpkg.com", {});
    assert.equal(result, 'import("./something.js?module");');
  });

  it('rewrites `import("react");`', () => {
    let result = rewriteImports('import("react");', "https://unpkg.com", { react: "15.6.1" });
    assert.equal(result, 'import("https://unpkg.com/react@15.6.1?module");');
  });
});
