import * as React from 'react'
import { styled } from '../../../styled/index'
import copy from 'copy-to-clipboard'

import Share from '../../Share'
// import SchemaReload from './SchemaReload'
import { createStructuredSelector } from 'reselect'
import {
	getEndpoint,
	getSelectedSession,
	getEndpointUnreachable,
	getIsPollingSchema,
} from '../../../state/sessions/selectors'
import { connect } from 'react-redux'
import { getFixedEndpoint } from '../../../state/general/selectors'
import * as PropTypes from 'prop-types'
import {
	editEndpoint,
	prettifyQuery,
	refetchSchema,
} from '../../../state/sessions/actions'
import { share } from '../../../state/sharing/actions'
import { openHistory } from '../../../state/general/actions'
import { getSettings } from '../../../state/workspace/reducers'
import { ISettings } from '../../../types'

export interface Props {
	endpoint: string
	shareEnabled?: boolean
	fixedEndpoint?: boolean
	isPollingSchema: boolean
	endpointUnreachable: boolean

	editEndpoint: (value: string) => void
	prettifyQuery: () => void
	openHistory: () => void
	share: () => void
	refetchSchema: () => void

	settings: ISettings
}

class TopBar extends React.Component<Props, {}> {
	static contextTypes = {
		store: PropTypes.shape({
			subscribe: PropTypes.func.isRequired,
			dispatch: PropTypes.func.isRequired,
			getState: PropTypes.func.isRequired,
		}),
	}

	render() {
		// const { endpointUnreachable, settings } = this.props
		return (
			<TopBarWrapper>
				<Button onClick={this.props.prettifyQuery}>Prettify</Button>
				<Button onClick={this.openHistory}>History</Button>

				<Button onClick={this.copyCurlToClipboard}>Copy CURL</Button>
				{this.props.shareEnabled && (
					<Share>
						<Button>Share Playground</Button>
					</Share>
				)}
			</TopBarWrapper>
		)
	}

	copyCurlToClipboard = () => {
		const curl = this.getCurl()
		copy(curl)
	}
	onChange = e => {
		this.props.editEndpoint(e.target.value)
	}
	onKeyDown = e => {
		if (e.keyCode === 13) {
			this.props.refetchSchema()
		}
	}
	openHistory = () => {
		this.props.openHistory()
	}
	getCurl = () => {
		// no need to rerender the whole time. only on-demand the store is fetched
		const session = getSelectedSession(this.context.store.getState())
		let variables
		try {
			variables = JSON.parse(session.variables)
		} catch (e) {
			//
		}
		const data = JSON.stringify({
			query: session.query,
			variables,
			operationName: session.operationName,
		})
		let sessionHeaders
		try {
			sessionHeaders = JSON.parse(session.headers!)
		} catch (e) {
			//
		}
		const headers = {
			'Accept-Encoding': 'gzip, deflate, br',
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Connection: 'keep-alive',
			DNT: '1',
			Origin: location.origin || session.endpoint,
			...sessionHeaders,
		}
		const headersString = Object.keys(headers)
			.map(key => {
				const value = headers[key]
				return `-H '${key}: ${value}'`
			})
			.join(' ')
		return `curl '${session.endpoint}' ${headersString} --data-binary '${data}' --compressed`
	}
}

const mapStateToProps = createStructuredSelector({
	endpoint: getEndpoint,
	fixedEndpoint: getFixedEndpoint,
	isPollingSchema: getIsPollingSchema,
	endpointUnreachable: getEndpointUnreachable,
	settings: getSettings,
})

export default connect(
	mapStateToProps,
	{
		editEndpoint,
		prettifyQuery,
		openHistory,
		share,
		refetchSchema,
	},
)(TopBar)

export const Button = styled.button`
	text-transform: uppercase;
	font-weight: 600;
	color: ${p => p.theme.editorColours.buttonText};
	background: ${p => p.theme.editorColours.button};
	border-radius: 2px;
	flex: 0 0 auto;
	letter-spacing: 0.53px;
	font-size: 14px;
	padding: 5px 8px 6px 9px;
	margin-left: 8px;

	cursor: pointer;
	transition: 0.1s linear background-color;
	&:first-child {
		margin-left: 0;
	}
	&:hover {
		background-color: ${p => p.theme.editorColours.buttonHover};
	}
`

const TopBarWrapper = styled.div`
	display: flex;
	background: ${p => p.theme.editorColours.navigationBar};
	padding: 10px;
	align-items: center;
	border-bottom: 1px solid rgb(24, 26, 31);
`

// interface UrlBarProps {
// 	active: boolean
// }

// const UrlBar = styled.input<UrlBarProps>`
// 	background: #27292b;
// 	border-radius: 4px;
// 	color: ${p => (p.active ? p.theme.editorColours.navigationBarText : p.theme.editorColours.textInactive)};
// 	border: 1px solid ${p => p.theme.editorColours.background};
// 	padding: 6px 12px;
// 	padding-left: 30px;
// 	font-size: 13px;
// 	flex: 1;
// `

// const UrlBarWrapper = styled.div`
// 	flex: 1;
// 	margin-left: 6px;
// 	position: relative;
// 	display: flex;
// 	align-items: center;
// `

// const ReachError = styled.div`
// 	position: absolute;
// 	right: 5px;
// 	display: flex;
// 	align-items: center;
// 	color: #f25c54;
// `

// const Pulse = styled.div`
// 	width: 16px;
// 	height: 16px;
// 	background-color: ${p => p.theme.editorColours.icon};
// 	border-radius: 100%;
// `

// const SpinnerWrapper = styled.div`
// 	position: relative;
// 	margin: 6px;
// `

// const Spinner = () => (
// 	<SpinnerWrapper>
// 		<Pulse />
// 	</SpinnerWrapper>
// )
