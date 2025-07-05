import { useState, useEffect } from 'react'

type ToastType = 'default' | 'destructive'

interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: ToastType
}

interface ToastState {
  toasts: Toast[]
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: {
  type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST'
  toast?: Toast
}) {
  switch (action.type) {
    case 'ADD_TOAST':
      memoryState = {
        ...memoryState,
        toasts: [action.toast!, ...memoryState.toasts],
      }
      break
    case 'UPDATE_TOAST':
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast!.id ? { ...t, ...action.toast } : t
        ),
      }
      break
    case 'DISMISS_TOAST': {
      const { toastId } = action.toast as any
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', toast: { id: toastId } as Toast })
      }, 1000)
      return
    }
    case 'REMOVE_TOAST':
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.filter((t) => t.id !== action.toast!.id),
      }
      break
  }
  listeners.forEach((listener) => listener(memoryState))
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: ({ ...props }: Omit<Toast, 'id'>) => {
      const id = String(Date.now())

      const update = (props: Partial<Toast>) =>
        dispatch({
          type: 'UPDATE_TOAST',
          toast: { ...props, id },
        })

      const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toast: { id } as any })

      dispatch({
        type: 'ADD_TOAST',
        toast: {
          ...props,
          id,
        },
      })

      return {
        id,
        dismiss,
        update,
      }
    },
    dismiss: (toastId?: string) => {
      dispatch({ type: 'DISMISS_TOAST', toast: { toastId } as any })
    },
  }
}