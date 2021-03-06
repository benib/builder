var sourceMap = require('source-map');
var traceur = require('traceur');
var path = require('path');

var wrapSourceMap = function(map) {
  return new sourceMap.SourceMapConsumer(map);
};

var sourceMapRegEx = /\/\/[@#] ?(sourceURL|sourceMappingURL)=([^\n'"]+)/;
exports.removeSourceMaps = function(source) {
  return source.replace(sourceMapRegEx, '');
};

function getMapObject(map) {
  if (typeof map != 'string')
    return map;

  try {
    return JSON.parse(map);
  }
  catch(error) {
    throw new Error('Invalid JSON: ' + map);
  }
}

exports.concatenateSourceMaps = function(sourceFilename, mapsWithOffsets, baseURL) {
  var generated = new sourceMap.SourceMapGenerator({
    file: sourceFilename
  });

  mapsWithOffsets.forEach(function(pair) {
    var offset = pair[0];
    var map = getMapObject(pair[1]);

    wrapSourceMap(map).eachMapping(function(mapping) {
      if (mapping.source.match(/\/@traceur/))
        return;

      generated.addMapping({
        generated: {
          line: offset + mapping.generatedLine,
          column: mapping.generatedColumn
        },
        original: {
          line: mapping.originalLine,
          column: mapping.originalColumn
        },
        source: mapping.source
      });

      originalLastLine = mapping.generatedLine;
    });
  });

  // convert from library internals format to canonical
  var normalized = JSON.parse(JSON.stringify(generated));
  // convert paths to relative
  normalized.sources = normalized.sources.map(function(source) {
    return path.relative(baseURL, source).replace(/\\/g, '/');
  });
  return JSON.stringify(normalized);
};
