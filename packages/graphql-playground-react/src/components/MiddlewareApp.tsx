import * as React from 'react'
import styled from 'styled-components'
import { Provider } from 'react-redux'
import createStore from '../state/createStore'
import { getSettings } from '../state/workspace/reducers'
import { setSettingsString } from '../state/general/actions'
import PlaygroundWrapper, { PlaygroundWrapperProps } from './PlaygroundWrapper'
import { Store } from 'redux'
import { ClipLoader } from 'react-spinners'

interface MiddlewareState {
	store?: Store<any>
}

export default class MiddlewareApp extends React.Component<
	PlaygroundWrapperProps,
	MiddlewareState
> {
	state = {} as MiddlewareState
	async componentDidMount() {
		const store = await createStore(
			this.props.workspaceEndpoint || '',
			this.props.headers || {},
		)
		const initialSettings = getSettings(store.getState())
		const mergedSettings = { ...initialSettings, ...this.props.settings }
		const settingsString = JSON.stringify(mergedSettings, null, 2)
		store.dispatch(setSettingsString(settingsString))
		this.setState({ store })
	}

	render() {
		if (!this.state.store) {
			return (
				<LoaderWrapper>
					<ClipLoader color="white" />
				</LoaderWrapper>
			)
		}

		return (
			<Provider store={this.state.store}>
				<PlaygroundWrapper {...this.props} />
			</Provider>
		)
	}
}

const LoaderWrapper = styled.div`
	width: 100vw;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
`
