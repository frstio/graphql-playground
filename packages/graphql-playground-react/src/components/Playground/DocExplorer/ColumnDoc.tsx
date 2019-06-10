import * as React from 'react'
import { columnWidth } from '../../../constants'
import { styled } from '../../../styled'

export interface Props {
	children: any
	overflow?: boolean
	width?: number
}

const ColumnDoc = ({
	children,
	overflow = true,
	width = columnWidth,
}: Props) => {
	return (
		<Column style={{ width }} verticalScroll={overflow}>
			{children}
		</Column>
	)
}

export default ColumnDoc

interface ColumnProps {
	verticalScroll: boolean
}

const Column = styled.div<ColumnProps>`
	background: #282828;
	display: flex;
	flex: 0 0 auto;
	flex-flow: column;
	padding-bottom: 20px;
	border-right: 1px solid ${p => p.theme.colours.black10};
	overflow-x: ${p => (p.verticalScroll ? 'hidden' : 'auto')};
	overflow-y: ${p => (p.verticalScroll ? 'scroll' : 'auto')};
`
