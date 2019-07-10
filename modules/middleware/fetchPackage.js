import addLeadingSlash from '../utils/addLeadingSlash.js';
import createPackageURL from '../utils/createPackageURL.js';
import createSearch from '../utils/createSearch.js';
import { getPackageConfig, resolveVersion } from '../utils/npm.js';

function semverRedirect(req, res, newVersion) {
  res
    .set({
      'Cache-Control': 'public, s-maxage=600, max-age=60', // 10 mins on CDN, 1 min on clients
      'Cache-Tag': 'redirect, semver-redirect'
    })
    .redirect(
      302,
      createPackageURL(req.packageName, newVersion, req.filename, req.search)
    );
}

function filenameRedirect(req, res) {
  let filename;
  if (req.query.module != null) {
    // See https://github.com/rollup/rollup/wiki/pkg.module
    filename = req.packageConfig.module || req.packageConfig['jsnext:main'];

    if (!filename) {
      // https://nodejs.org/api/esm.html#esm_code_package_json_code_code_type_code_field
      if (req.packageConfig.type === 'module') {
        // Use whatever is in pkg.main or index.js
        filename = req.packageConfig.main || '/index.js';
      } else if (
        req.packageConfig.main &&
        /\.mjs$/.test(req.packageConfig.main)
      ) {
        // Use .mjs file in pkg.main
        filename = req.packageConfig.main;
      }
    }

    if (!filename) {
      return res
        .status(404)
        .type('text')
        .send(`Package ${req.packageSpec} does not contain an ES module`);
    }
  } else if (
    req.query.main &&
    req.packageConfig[req.query.main] &&
    typeof req.packageConfig[req.query.main] === 'string'
  ) {
    // Deprecated, see #63
    filename = req.packageConfig[req.query.main];
  } else if (
    req.packageConfig.unpkg &&
    typeof req.packageConfig.unpkg === 'string'
  ) {
    filename = req.packageConfig.unpkg;
  } else if (
    req.packageConfig.browser &&
    typeof req.packageConfig.browser === 'string'
  ) {
    // Deprecated, see #63
    filename = req.packageConfig.browser;
  } else {
    filename = req.packageConfig.main || '/index.js';
  }

  // Redirect to the exact filename so relative imports
  // and URLs resolve correctly.
  res
    .set({
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'Cache-Tag': 'redirect, filename-redirect'
    })
    .redirect(
      302,
      createPackageURL(
        req.packageName,
        req.packageVersion,
        addLeadingSlash(filename),
        createSearch(req.query)
      )
    );
}

/**
 * Fetch the package config. Redirect to the exact version if the request
 * targets a tag or uses semver, or to the exact filename if the request
 * omits the filename.
 */
export default async function fetchPackage(req, res, next) {
  const version = await resolveVersion(req.packageName, req.packageVersion);

  if (!version) {
    return res
      .status(404)
      .type('text')
      .send(`Cannot find package ${req.packageSpec}`);
  }

  if (version !== req.packageVersion) {
    return semverRedirect(req, res, version);
  }

  req.packageConfig = await getPackageConfig(
    req.packageName,
    req.packageVersion
  );

  if (!req.packageConfig) {
    // TODO: Log why.
    return res
      .status(500)
      .type('text')
      .send(`Cannot get config for package ${req.packageSpec}`);
  }

  if (!req.filename) {
    return filenameRedirect(req, res);
  }

  next();
}
