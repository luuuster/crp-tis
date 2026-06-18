import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('resolve: preenche data, loading volta a false, sem erro', async () => {
    const { result } = renderHook(() => useAsync(async (n: number) => n * 2))
    await act(async () => {
      await result.current.run(3)
    })
    expect(result.current.data).toBe(6)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('rejeita: preenche error, mantém data null', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useAsync(async () => { throw new Error('boom') }))
    await act(async () => {
      await result.current.run()
    })
    expect(result.current.error?.message).toBe('boom')
    expect(result.current.data).toBeNull()
    spy.mockRestore()
  })

  it('retry reexecuta com os ÚLTIMOS argumentos', async () => {
    const fn = vi.fn(async (n: number) => n + 1)
    const { result } = renderHook(() => useAsync(fn))
    await act(async () => {
      await result.current.run(10)
    })
    await act(async () => {
      await result.current.retry()
    })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(10)
    expect(result.current.data).toBe(11)
  })
})
