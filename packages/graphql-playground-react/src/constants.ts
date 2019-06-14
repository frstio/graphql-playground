import cuid from 'cuid'
import { List, Map } from 'immutable'
import { getQueryTypes } from './components/Playground/util/getQueryTypes'
import { OperationDefinition, QueryTypes, ResponseRecord, VariableToType } from './state/sessions/reducers'

export const columnWidth = 300

export const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`

export const defaultQuery = '# Write your query or mutation here\n'

export const modalStyle = {
	overlay: {
		zIndex: 99999,
		backgroundColor: 'rgba(15,32,46,.9)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		position: 'relative',
		width: 976,
		height: 'auto',
		top: 'initial',
		left: 'initial',
		right: 'initial',
		bottom: 'initial',
		borderRadius: 2,
		padding: 0,
		border: 'none',
		background: 'none',
		boxShadow: '0 1px 7px rgba(0,0,0,.2)',
	},
}

export interface ISession {
	id: string
	endpoint: string

	query: string
	file?: string
	variables: string
	responses?: List<ResponseRecord>
	operationName?: string
	queryRunning: boolean
	subscriptionActive: boolean

	// query facts
	operations: List<OperationDefinition>
	variableToType: VariableToType

	// additional props that are interactive in graphiql, these are not represented in graphiqls state
	queryTypes: QueryTypes
	date: Date
	hasMutation: boolean
	hasSubscription: boolean
	hasQuery: boolean

	isFile?: boolean
	starred?: boolean
	name?: string
	filePath?: string
	selectedUserToken?: string
	headers?: string
	absolutePath?: string
	isSettingsTab?: boolean
	isConfigTab?: boolean

	currentQueryStartTime?: Date
	currentQueryEndTime?: Date

	isReloadingSchema: boolean
	isSchemaPendingUpdate: boolean

	responseExtensions: any
	queryVariablesActive: boolean
	endpointUnreachable: boolean

	// editor settings
	editorFlex: number
	variableEditorOpen: boolean
	variableEditorHeight: number
	responseTracingOpen: boolean
	responseTracingHeight: number
	nextQueryStartTime?: Date
	tracingSupported?: boolean
	docExplorerWidth: number
	changed?: boolean
	scrollTop?: number
}

export function getDefaultSession(endpoint: string): ISession {
	return {
		id: cuid(),
		query: defaultQuery,
		variables: '',
		responses: List([]),
		endpoint,
		operationName: undefined,
		hasMutation: false,
		hasSubscription: false,
		hasQuery: false,
		queryTypes: getQueryTypes(defaultQuery),
		subscriptionActive: false,
		date: new Date(),
		starred: false,
		queryRunning: false,
		operations: List([]),
		isReloadingSchema: false,
		isSchemaPendingUpdate: false,
		responseExtensions: {},
		queryVariablesActive: false,
		endpointUnreachable: false,
		editorFlex: 1,
		variableEditorOpen: false,
		variableEditorHeight: 200,
		responseTracingOpen: false,
		responseTracingHeight: 300,
		docExplorerWidth: 350,
		variableToType: Map({}),
		headers: '',
		file: undefined,
		isFile: false,
		name: undefined,
		filePath: undefined,
		selectedUserToken: undefined,
		absolutePath: undefined,
		isSettingsTab: undefined,
		isConfigTab: undefined,
		currentQueryStartTime: undefined,
		currentQueryEndTime: undefined,
		nextQueryStartTime: undefined,
		tracingSupported: undefined,
		changed: undefined,
		scrollTop: undefined,
	}
}
