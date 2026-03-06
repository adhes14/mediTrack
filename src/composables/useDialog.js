import { ref } from 'vue'

const isVisible = ref(false)
const type = ref('alert') // 'alert' or 'confirm'
const title = ref('')
const message = ref('')
let resolvePromise = null

export function useDialog() {
  const show = (options) => {
    title.value = options.title || (options.type === 'confirm' ? 'Confirm' : 'Alert')
    message.value = options.message || ''
    type.value = options.type || 'alert'
    isVisible.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const alert = (msg, alertTitle) => {
    return show({ type: 'alert', message: msg, title: alertTitle })
  }

  const confirm = (msg, confirmTitle) => {
    return show({ type: 'confirm', message: msg, title: confirmTitle })
  }

  const confirmAction = () => {
    isVisible.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  const cancelAction = () => {
    isVisible.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isVisible,
    type,
    title,
    message,
    alert,
    confirm,
    confirmAction,
    cancelAction
  }
}
