import * as styledComponents from 'styled-components'
import { ThemedStyledComponentsModule } from 'styled-components' // tslint:disable-line
import { ComponentClass } from 'react' // tslint:disable-line

import { theme, ThemeInterface } from './theme'

const {
	default: styled,
	css,
	keyframes,
	ThemeProvider,
	withTheme,
	createGlobalStyle,
} = styledComponents as ThemedStyledComponentsModule<ThemeInterface>

export {
	css,
	keyframes,
	ThemeProvider,
	theme,
	withTheme,
	createGlobalStyle,
	ThemeInterface,
}
export default styled

export { ComponentClass }
