import * as path from 'path';
import * as webpack from 'webpack';
import * as memoryfs from 'memory-fs';
import { VueLoaderPlugin } from 'vue-loader';
import {
  GraphQLLoaderOptions,
  defaultLoaderOptions
} from '../src/loader-options';

interface CompilationResult {
  stats: webpack.Stats;
  vfs: any;
}

const webpackCompilation = (
  componentName,
  options: GraphQLLoaderOptions = defaultLoaderOptions
): Promise<CompilationResult> => {
  const vfs = new memoryfs();
  const fixture = `./__fixtures__/${componentName}.vue`;
  const compiler = webpack({
    // @ts-ignore
    mode: 'production',
    // @ts-ignore
    context: __dirname,
    optimization: {
      minimize: false
    },
    entry: `./${fixture}`,
    output: {
      libraryTarget: 'commonjs',
      library: 'component',
      path: path.resolve(__dirname),
      filename: `${componentName}.js`
    },
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm.js'
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          resourceQuery: /blockType=graphql/,
          use: [
            {
              loader: require.resolve('../lib/index'),
              options: {
                noAnonymousQueries: true
              }
            }
          ]
        }
      ]
    },
    plugins: [new VueLoaderPlugin()]
  });
  compiler.outputFileSystem = vfs;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) reject(err || stats.toJson().errors);
      resolve({ stats, vfs });
    });
  });
};

export default webpackCompilation;