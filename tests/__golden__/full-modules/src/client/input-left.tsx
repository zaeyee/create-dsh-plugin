/**
 * Composer tool-row left control (conversation.input.left slot): a persistent
 * small button at the left end of the input card's tool row, after the
 * built-in chrome (access mode / plan / attach). Session-level list.
 * Reference: ui-conversation declares this slot at runtime (no built-in
 * entries — an open additive seat).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface InputLeftProps extends PropsRuntime<'conversation.input.left'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** A toggle-able persistent small button. */
export function InputLeft({ t }: InputLeftProps) {
  const [lit, setLit] = useState(false)
  return (
    <button type="button" className="dtpl-input-tool" aria-pressed={lit} onClick={() => setLit(!lit)}>
      <span className="dtpl-sidebar-dot">{lit ? '●' : '○'}</span>
      <span>{t('inputLeft.label')}</span>
    </button>
  )
}

/** Register the demo control on `conversation.input.left`. */
export function registerInputLeft(ctx: ClientContext): void {
  ctx.slots.inject('conversation.input.left', () =>
    ctx.slots.register({ name: 'conversation.input.left', id: NAMESPACE, order: 30, locale: NAMESPACE }, InputLeft)
  )
}
