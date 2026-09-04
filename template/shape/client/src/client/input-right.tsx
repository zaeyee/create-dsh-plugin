/**
 * Composer tool-row right control (conversation.input.right slot): a
 * persistent small button at the right end of the tool row, next to the send
 * key. Session-level list; shares the single-row height budget with
 * input.left. Reference: ui-conversation declares this slot at runtime (no
 * built-in entries — an open additive seat).
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { NAMESPACE } from './constants.ts'

export interface InputRightProps extends PropsRuntime<'conversation.input.right'> {
  t: TranslateNS<typeof NAMESPACE>
}

/** A local counter button. */
export function InputRight({ t }: InputRightProps) {
  const [count, setCount] = useState(0)
  return (
    <button type="button" className="dtpl-input-tool" onClick={() => setCount(count + 1)}>
      <span>
        {t('inputRight.label')} · {count}
      </span>
    </button>
  )
}

/** Register the demo control on `conversation.input.right`. */
export function registerInputRight(ctx: ClientContext): void {
  ctx.slots.inject('conversation.input.right', () =>
    ctx.slots.register({ name: 'conversation.input.right', id: NAMESPACE, order: 30, locale: NAMESPACE }, InputRight)
  )
}
