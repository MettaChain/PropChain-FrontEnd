module.exports = {
  presets: [
    ['next/babel', {
      'preset-env': {
        modules: ['commonjs'],
      },
    }],
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      helpers: true,
      regenerator: true,
    }],
  ],
  env: {
    test: {
      presets: [
        ['next/babel', {
          'preset-env': {
            modules: 'commonjs',
          },
        }],
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          helpers: true,
          regenerator: true,
        }],
      ],
    },
  },
};
