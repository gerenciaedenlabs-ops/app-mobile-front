module.exports = function (api) {
  api.cache(true);
  return {
    // jsxImportSource: nativewind necesita interceptar el JSX para inyectar `className`.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
