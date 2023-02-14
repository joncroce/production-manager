module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    {
      "name": "@storybook/addon-postcss",
      "options": {
        "postcssLoaderOptions": {
          "implementation": require('postcss'),
          "postcssOptions": {
            "plugins": [
              require('postcss-preset-env'),
              require('postcss-nested')
            ]
          }
        },
        "cssLoaderOptions": {
          "importLoaders": 1
        }
      }
    }
  ],
  "framework": "@storybook/react",
  "core": {
    "builder": "@storybook/builder-webpack5"
  },
  "staticDirs": ["../public"],
}