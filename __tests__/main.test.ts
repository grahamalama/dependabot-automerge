import {parseMergeStrategy} from '../src/main'
import {expect, test, describe} from '@jest/globals'

describe('parseMergeStrategy', () => {
  test('valid merge strategy input', () => {
    expect(parseMergeStrategy('merge')).toEqual('merge')
  })
  test('valid squash strategy input', () => {
    expect(parseMergeStrategy('squash')).toEqual('squash')
  })
  test('valid rebase strategy input', () => {
    expect(parseMergeStrategy('rebase')).toEqual('rebase')
  })
  test('invalid input', () => {
    expect(() => parseMergeStrategy('foo')).toThrowError(
      'Invalid merge-strategy input: foo'
    )
  })
  test('empty input', () => {
    expect(() => parseMergeStrategy('')).toThrowError(
      'Invalid merge-strategy input: '
    )
  })
  test('input with leading/trailing white space', () => {
    ;() =>
      expect(parseMergeStrategy('   merge  ')).toThrowError(
        'Invalid merge-strategy input:    merge  '
      )
  })
  test('input with different capitalization', () => {
    ;() =>
      expect(parseMergeStrategy('MeRge')).toThrowError(
        'Invalid merge-strategy input: MeRge'
      )
  })
})
