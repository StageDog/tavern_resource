import HtmlInlineScriptWebpackPlugin from 'html-inline-script-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
import { Server } from 'socket.io';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';
const require = createRequire(import.meta.url);
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
  port: number;
  entries: Entry[];
}
interface Entry {
  script: string;
  html?: string;
}

function parse_entry(script_file: string) {
  const html = path.join(path.dirname(script_file), 'index.html');
  if (fs.existsSync(html)) {
    return { script: script_file, html };
  }
  return { script: script_file };
}

const config: Config = {
  port: 6621,
  entries: [...fs.globSync('src/**/index.ts'), ...fs.globSync('src/**/index.js')].map(parse_entry),
};

let io: Server;
function watch_it(compiler: webpack.Compiler) {
  if (compiler.options.watch) {
    if (!io) {
      const port = config.port ?? 6621;
      io = new Server(port, { cors: { origin: '*' } });
      console.info(`[Listener] 已启动酒馆监听服务, 正在监听: http://0.0.0.0:${port}`);
      io.on('connect', socket => {
        console.info(`[Listener] 成功连接到酒馆网页 '${socket.id}', 初始化推送...`);
        socket.on('disconnect', reason => {
          console.info(`[Listener] 与酒馆网页 '${socket.id}' 断开连接: ${reason}`);
        });
      });
    }

    compiler.hooks.done.tap('updater', () => {
      console.info('\n[Listener] 检测到完成编译, 推送更新事件...');
      io.emit('iframe_updated');
    });
  }
}

function parse_configuration(entry: Entry): (_env: any, argv: any) => webpack.Configuration {
  const script_filepath = path.parse(entry.script);

  let plugins: webpack.Configuration['plugins'] = [];
  if (entry.html === undefined) {
    plugins.push(new MiniCssExtractPlugin());
  } else {
    plugins.push(
      new HtmlWebpackPlugin({
        template: path.join(__dirname, entry.html),
        filename: path.parse(entry.html).base,
        scriptLoading: 'module',
        cache: false,
      }),
      new HtmlInlineScriptWebpackPlugin(),
      new MiniCssExtractPlugin(),
      new HTMLInlineCSSWebpackPlugin({
        styleTagFactory({ style }: { style: string }) {
          return `<style>${style}</style>`;
        },
      }),
    );
  }
  plugins.push({ apply: watch_it }, new VueLoaderPlugin());

  return (_env, argv) => ({
    experiments: {
      outputModule: true,
    },
    devtool: argv.mode === 'production' ? false : 'eval-source-map',
    watchOptions: {
      ignored: ['**/dist', '**/node_modules'],
    },
    entry: path.join(__dirname, entry.script),
    target: 'browserslist',
    output: {
      devtoolModuleFilenameTemplate: 'webpack://tavern_helper_template/[resource-path]?[loaders]',
      filename: `${script_filepath.name}.js`,
      path: path.join(__dirname, 'dist', path.relative(path.join(__dirname, 'src'), script_filepath.dir)),
      chunkFilename: `${script_filepath.name}.[contenthash].chunk.js`,
      asyncChunks: true,
      chunkLoading: 'import',
      clean: true,
      publicPath: '',
      library: {
        type: 'module',
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader',
          exclude: /node_modules/,
        },
        {
          oneOf: [
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
              use: ['postcss-loader', 'sass-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: ['postcss-loader'],
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              resourceQuery: /raw/,
              type: 'asset/source',
              exclude: /node_modules/,
            },
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                onlyCompileBundledFiles: true,
                compilerOptions: {
                  noUnusedLocals: false,
                  noUnusedParameters: false,
                },
              },
              exclude: /node_modules/,
            },
            {
              test: /\.html?$/,
              use: 'html-loader',
              exclude: /node_modules/,
            },
            {
              test: /\.(sa|sc)ss$/,
              use: [
                MiniCssExtractPlugin.loader,
                { loader: 'css-loader', options: { url: false } },
                'postcss-loader',
                'sass-loader',
              ],
              exclude: /node_modules/,
            },
            {
              test: /\.css$/,
              use: [MiniCssExtractPlugin.loader, { loader: 'css-loader', options: { url: false } }, 'postcss-loader'],
              exclude: /node_modules/,
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.css'],
      plugins: [
        new TsconfigPathsPlugin({
          extensions: ['.ts', '.js', '.tsx', '.jsx'],
          configFile: path.join(__dirname, 'tsconfig.json'),
        }),
      ],
      alias: {},
    },
    plugins: plugins,
    optimization: {
      minimize: true,
      minimizer: [
        argv.mode === 'production'
          ? new TerserPlugin({
              terserOptions: { format: { quote_style: 1 }, mangle: { reserved: ['_', 'toastr', 'YAML', '$', 'z'] } },
            })
          : new TerserPlugin({
              extractComments: false,
              terserOptions: {
                format: { beautify: true, indent_level: 2 },
                compress: false,
                mangle: false,
              },
            }),
      ],
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            name: 'default',
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    externals: [
      ({ context, request }, callback) => {
        if (!context || !request) {
          return callback();
        }

        if (
          request.startsWith('-') ||
          request.startsWith('.') ||
          request.startsWith('/') ||
          request.startsWith('@') ||
          request.startsWith('http') ||
          path.isAbsolute(request) ||
          fs.existsSync(path.join(context, request)) ||
          fs.existsSync(request)
        ) {
          return callback();
        }

        const builtin = {
          lodash: '_',
          toastr: 'toastr',
          yaml: 'YAML',
          jquery: '$',
          zod: 'z',
        };
        if (request in builtin) {
          return callback(null, 'var ' + builtin[request as keyof typeof builtin]);
        }
        return callback(null, 'module-import https://testingcf.jsdelivr.net/npm/' + request + '/+esm');
      },
    ],
  });
}

export default config.entries.map(parse_configuration);
