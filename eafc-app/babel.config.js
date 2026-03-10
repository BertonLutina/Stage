module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      'babel-preset-expo',
      ...(!isTest ? ['nativewind/babel'] : []),
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
