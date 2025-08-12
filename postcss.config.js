const config = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
    require('postcss-nested'),
    require('postcss-minify'),
  ],
};

module.exports = config;
