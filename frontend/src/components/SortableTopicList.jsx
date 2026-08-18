import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import Card from '@mui/material/Card'
import TopicDialog from './TopicDialog'

const SortableTopicItem = ({ topic, index, isReadOnly }) => {
  const { ref, isDragging } = useSortable({
    id: topic.id,
    index,
    disabled: isReadOnly,
  })

  const style = {
    opacity: isDragging ? 0.4 : 1,
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: '8px',
  }

  return (
    <div
      ref={isReadOnly ? null : ref}
      style={{ ...style, cursor: isReadOnly ? 'default' : 'grab' }}
    >
      <Card
        className="dragndrop-index"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '40px',
          maxHeight: 'none',
          padding: 0,
        }}
      >
        {index + 1}
      </Card>
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopicDialog topic={topic} showDragIcon={!isReadOnly} />
      </div>
    </div>
  )
}

const SortableTopicList = ({ topics, onUpdate, isReadOnly }) => {
  const handleDragEnd = (event) => {
    if (!event.canceled && onUpdate) {
      const newTopics = move(topics, event)
      onUpdate(null, newTopics)
    }
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="dragndrop-list">
        {topics.map((topic, index) => (
          <SortableTopicItem key={topic.id} topic={topic} index={index} isReadOnly={isReadOnly} />
        ))}
      </div>
    </DragDropProvider>
  )
}

export default SortableTopicList
