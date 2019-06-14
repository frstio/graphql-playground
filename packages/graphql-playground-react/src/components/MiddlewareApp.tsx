import * as React from 'react'
import { Provider } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { Store } from 'redux'
import styled from 'styled-components'
import createStore from '../state/createStore'
import { setSettingsString } from '../state/general/actions'
import { getSettings } from '../state/workspace/reducers'
import PlaygroundWrapper, { PlaygroundWrapperProps } from './PlaygroundWrapper'

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
