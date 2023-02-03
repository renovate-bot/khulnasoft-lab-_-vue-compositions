import debounce from 'lodash.debounce'
import { ref, Ref, watch, watchEffect } from 'vue'

export function useDebouncedRef<T>(input: Ref<T>, wait: Ref<number> | number): Ref<T> {
  const waitRef = ref(wait)
  const copy = ref(input.value) as Ref<T>
  const update = debounce((value: T) => copy.value = value, waitRef.value)

  watchEffect(() => update(input.value))

  watch(copy, value => {
    if (value !== input.value) {
      input.value = value
    }
  }, { flush: 'sync' })

  return copy
}