import * as React from 'react'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import GraphQLBinApp from './GraphQLBinApp'

export default class Root extends React.Component<{}, {}> {
	render() {
		return (
			<BrowserRouter>
				<Switch>
					<Route path="/v2/:id" component={GraphQLBinApp} />
					<Redirect exact={true} from="/" to="/v2/new" />
					<Route path="*" component={RedirectToOldPlayground} />
				</Switch>
			</BrowserRouter>
		)
	}
}

const RedirectToOldPlayground = props => {
	location.href = `https://legacy.graphqlbin.com${location.pathname}${location.search}`
	return null
}
