import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { resolve as resolvePath } from 'path'
import { inspect } from 'util'
import * as webpack from 'webpack'
import 'webpack-dev-server'
import { argv } from 'yargs'
import { name, version } from './package.json'

const optimized =
	process.env.NODE_ENV === 'production' || process.env.OPTIMIZE === 'true' || (argv.p && !argv['skip-optimized'])

const generateSourceMap = process.env.SOURCE_MAPS
const useBabel = optimized || !!argv['use-babel'] || !!process.env.USE_BABEL

const outputPrefix = ``
const vendorsChunkName = 'kernel'

const useHashedFilenames = !!process.env.USE_HASHED_FILENAMES || optimized
const paths = {
	font: `${outputPrefix}etc/font/${useHashedFilenames ? '[hash:8].' : '[name]'}[ext]`,
	video: `${outputPrefix}etc/video/[name].${useHashedFilenames ? '[hash:8].' : ''}[ext]`,
	imagePrefix: `${outputPrefix}etc/`,
	image: `${outputPrefix}etc/${useHashedFilenames ? '[hash:8].' : '[name]'}[ext]`,
	icon: `${outputPrefix}var/spool/${useHashedFilenames ? '[hash:8].' : '[name]'}[ext]`,
	js: `${outputPrefix}usr/lib/[name].${useHashedFilenames ? '[chunkhash:8].' : ''}js`,
	css: `${outputPrefix}var/[name].${useHashedFilenames ? '[contenthash:8].' : ''}css`,
}

const babelOptions = {
	cacheDirectory: true,
	babelrc: false,
	sourceMaps: generateSourceMap || process.env.DEV_TOOL ? true : false,
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					browsers: ['last 2 versions', 'ie >= 10'],
				},
			},
		],
		'@babel/preset-typescript',
		'@babel/preset-react',
	],
	plugins: [
		['@babel/plugin-proposal-decorators', { legacy: true }],
		['@babel/plugin-proposal-class-properties', { loose: true }],
		'@babel/plugin-proposal-numeric-separator',
		'@babel/plugin-syntax-dynamic-import',
		'babel-plugin-styled-components',
		'react-hot-loader/babel',
	],
}

const fontOptions = {
	// variants: {
	// 	Roboto: {
	// 		'400': [],
	// 		'700': []
	// 	},
	// 	Teko: {
	// 		'400': [],
	// 		'700': []
	// 	}
	// }
}

const postcssLoader: webpack.Loader = {
	loader: 'postcss-loader',
	options: {
		plugins() {
			return [require('autoprefixer'), require('postcss-font-magician')(fontOptions)]
		},
	},
}

function noop() {}

const mainStylesMatcher = optimized ? /initial\.(less|scss)$/i : /^no-way-this-shit-matches/
const mainStylesExtractor = new MiniCssExtractPlugin({
	filename: 'inline-styles.css',
})

const imageLoader: webpack.Loader = {
	loader: 'image-webpack-loader',
	options: {
		bypassOnDebug: true,
		mozjpeg: {
			progressive: false,
			quality: 90,
		},
		gifsicle: {
			interlaced: false,
		},
		optipng: {
			optimizationLevel: 4,
		},
		pngquant: {
			quality: '75-90',
			speed: 3,
		},
	},
}

console.error(
	'configuration',
	inspect(
		{
			optimized,
			useHashedFilenames,
			useBabel,
			generateSourceMap,
		},
		{ colors: true, compact: false, depth: 20, showHidden: false },
	),
)

const config: webpack.Configuration = {
	// recordsPath: optimized ? path.resolve(__dirname, './records.json') : undefined,
	name,
	devtool: (process.env.DEV_TOOL as any) || false,
	mode: process.env.DEV_TOOL ? 'development' : 'production',
	target: 'web',

	entry: {
		main: ['babel-polyfill', 'index'],
	},

	output: {
		path: resolvePath(__dirname, 'dist'),
		crossOriginLoading: 'anonymous',
		publicPath: '/',
		filename: paths.js,
	},

	resolve: {
		extensions: ['.tsx', '.ts', '.mjs', '.js'],
		modules: ['src', 'node_modules'],
		alias: optimized
			? {}
			: {
					'react-dom': '@hot-loader/react-dom',
			  },
	},

	optimization: {
		namedModules: true,
		namedChunks: true,
		removeAvailableModules: true,

		minimize: process.env.NODE_ENV === 'production',
		mergeDuplicateChunks: optimized,
		portableRecords: optimized,
		usedExports: optimized,
		providedExports: optimized,
		concatenateModules: optimized,
		removeEmptyChunks: optimized,
		sideEffects: optimized,
		// runtimeChunk: 'single',

		runtimeChunk: {
			name: 'inline-runtime',
		},

		splitChunks: {
			chunks: 'all',
			name(module: webpack.loader.LoaderContext, chunks, cacheGroupKey) {
				const isNodeModuleRegex = /[\\/]node_modules[\\/](.*?)([\\/]|$)/
				const isNodeModule = isNodeModuleRegex.test(module.context)
				if (isNodeModule) {
					if (process.env.NODE_ENV !== 'production') {
						const packageName = module.context
							.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
							.replace('@', '')
						return packageName
					}
					return 'kernel'
				}
				return 'frst'
			},
			maxInitialRequests: Infinity,
			minSize: 100_000,
			cacheGroups: {
				plotky: {
					name: 'plotly',
					/* anything react goes here */
					test: /plotly/,
					enforce: true,
					chunks: 'all',
					priority: 100,
				},
				apollo: {
					name: 'apollo',
					/* anything apollo goes here */
					test: /apollo/,
					enforce: true,
					chunks: 'all',
					priority: 300,
				},
				kernel: {
					test: /node_modules/,
					chunks: 'all',
					priority: 500,
					reuseExistingChunk: true,
					// name(module) {
					// 	const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
					// 	return `kernel-${packageName.replace('@', '')}`
					// }
				},
			},
		},
	},

	devServer: {
		host: '0.0.0.0',
		port: 3000,
		disableHostCheck: true,
		historyApiFallback: true,
		stats: { colors: true },
		proxy: {
			'/api': {
				secure: false,
				changeOrigin: true,
				target: 'https://query.frst.dev:443',
			},
		},
	},

	module: {
		rules: [
			/* Images and Videos */
			{
				oneOf: [
					{
						test: /\.(png|gif|jpe?g|svg)$/,
						/* only for fav icons */
						include: /icons[/\\]/,
						use: [
							{
								loader: 'file-loader',
								options: {
									name: paths.icon,
								},
							},
							imageLoader,
						],
					},
					{
						test: /\.(png|gif|jpe?g|svg)$/,
						use: [
							{
								loader: 'url-loader',
								options: {
									limit: 2048,
									name: paths.image,
								},
							},
							imageLoader,
						],
					},
				],
			},
			{
				test: /\.mp4$/,
				use: {
					loader: 'file-loader',
					options: {
						name: paths.video,
					},
				},
			},
			/* FONTS */
			{
				test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: {
					loader: 'url-loader',
					options: {
						limit: 4096,
						mimetype: 'application/font-woff2',
						name: paths.font,
					},
				},
			},
			{
				test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: {
					loader: 'url-loader',
					options: {
						limit: 4096,
						mimetype: 'application/font-woff',
						name: paths.font,
					},
				},
			},
			{
				test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: {
					loader: 'file-loader',
					options: {
						name: paths.font,
					},
				},
			},

			{
				test: /\.css$/i,
				exclude: mainStylesMatcher,
				use: ['style-loader', 'css-loader', postcssLoader],
			},
			{
				test: /\.scss$/i,
				exclude: mainStylesMatcher,
				use: ['style-loader', 'css-loader', postcssLoader, 'sass-loader'],
			},
			{
				test: /\.less$/i,
				exclude: mainStylesMatcher,
				use: ['style-loader', 'css-loader', postcssLoader, 'less-loader'],
			},
			{
				oneOf: [
					{
						test: mainStylesMatcher,
						include: /\.less$/,
						use: [MiniCssExtractPlugin.loader, 'css-loader', postcssLoader, 'less-loader'],
					},
					{
						test: mainStylesMatcher,
						include: /\.scss$/,
						use: [MiniCssExtractPlugin.loader, 'css-loader', postcssLoader, 'sass-loader'],
					},
				],
			},
			{
				test: /.mjs$/,
				// include: /node_modules/,
				type: 'javascript/auto',
				use: [
					useBabel
						? {
								loader: 'babel-loader',
								options: babelOptions,
						  }
						: null,
				].filter(x => !!x),
			},
			{
				test: useBabel ? /\.jsx?$/i : /werenotusingbabel/,
				use: [
					{
						loader: 'babel-loader',
						options: babelOptions,
					},
				],
			},
			{
				test: /\.tsx?$/i,
				use: [
					{
						loader: 'babel-loader',
						options: babelOptions,
					},
				].filter(x => !!x),
			},
			{
				test: /\.html$/i,
				use: {
					loader: 'html-loader',
					options: {
						interpolate: 'require',
						minimize: optimized,
						collapseWhitespace: optimized,
						conservativeCollapse: false,
						attrs: ['img:src', 'source:src', 'video:poster', 'link:href'],
					},
				},
			},
		],
	},

	plugins: [
		new webpack.ContextReplacementPlugin(/graphql-language-service-interface[\/\\]dist/, /\.js$/),

		// new HardSourceWebpackPlugin(),
		// new HardSourceWebpackPlugin.ExcludeModulePlugin([
		// 	{
		// 		// HardSource works with mini-css-extract-plugin but due to how
		// 		// mini-css emits assets, assets are not emitted on repeated builds with
		// 		// mini-css and hard-source together. Ignoring the mini-css loader
		// 		// modules, but not the other css loader modules, excludes the modules
		// 		// that mini-css needs rebuilt to output assets every time.
		// 		test: /mini-css-extract-plugin[\\/]dist[\\/]loader/
		// 	}
		// ]),
		// new webpack.IgnorePlugin(/plotly-locale-/, /plotly.js$/),

		new webpack.DefinePlugin({
			BUILD_VERSION: JSON.stringify(version),
			PACKAGE_NAME: JSON.stringify(name),
			USE_BABEL: JSON.stringify(useBabel),
			AUTH_SITE: JSON.stringify(`https://auth.frst.${process.env.NODE_ENV === 'production' ? 'com' : 'dev'}`),
		}),

		generateSourceMap
			? new webpack.SourceMapDevToolPlugin({
					filename: '[name].js.map',
					exclude: /node_modules/,
					test: /.tsx?$/,
			  })
			: noop,

		optimized ? mainStylesExtractor : noop,

		new webpack.BannerPlugin({
			banner: `FRST/OS v${version} (c) ${new Date().getFullYear()}`,
			entryOnly: true,
		}),

		new HtmlWebpackPlugin({
			cache: false,
			favicon: './public/favicon.png',
			template: './public/index.html',
			inlineSource: optimized ? `(\.css|inline-runtime(\.[a-z0-9]+)?\.js)$` : undefined,
			filename: 'index.html',
		}),
	],
}
export default config
