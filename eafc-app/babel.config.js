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
            '@expo/vector-icons': './node_modules/@expo/vector-icons',
            '^@/(.*)$': './src/\\1',
            '@/api': './src/api',
            '@/lib': './src/lib',
            '@/translations': './src/translations',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
          },
          extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
