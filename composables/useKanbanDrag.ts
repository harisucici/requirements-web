import type { Ref } from 'vue'

/**
 * Native HTML5 drag-and-drop helpers for the kanban board (A-07).
 * Provides reactive state and event handler factories.
 */
export function useKanbanDrag<T extends { id: string }>() {
  const draggedItem = ref<T | null>(null) as Ref<T | null>
  const dragOverZone = ref<string | null>(null)

  function onDragStart(item: T) {
    return (e: DragEvent) => {
      draggedItem.value = item
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', item.id)
      }
    }
  }

  function onDragOver(zone: string) {
    return (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      dragOverZone.value = zone
    }
  }

  function onDragLeave() {
    dragOverZone.value = null
  }

  function onDrop(zone: string, handler: (item: T, zone: string) => void) {
    return (e: DragEvent) => {
      e.preventDefault()
      dragOverZone.value = null
      if (draggedItem.value) {
        handler(draggedItem.value, zone)
      }
      draggedItem.value = null
    }
  }

  function isDragging(item: T) {
    return draggedItem.value?.id === item.id
  }

  return {
    draggedItem,
    dragOverZone,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    isDragging,
  }
}
