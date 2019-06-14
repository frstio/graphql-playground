import { all } from 'redux-saga/effects'
import { fecthingSagas } from './sessions/fetchingSagas'
import { sessionsSagas } from './sessions/sagas'
import { sharingSagas } from './sharing/sharingSaga'
export { AllEffect } from 'redux-saga/effects'

export default function* rootSaga() {
	yield all([...sessionsSagas, ...fecthingSagas, ...sharingSagas])
}
