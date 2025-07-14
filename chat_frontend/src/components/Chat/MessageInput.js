import React, { useState } from 'react'
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'

export default function MessageInput({ onSendMessage }) {
  const [text, setText] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const addEmoji = (emoji) => {
    setText(prev => prev + emoji.native)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSendMessage(text)
    setText('')
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setShowPicker(v => !v)}
        style={{ fontSize: 24, marginRight: 8 }}
      >
        😊
      </button>

      {showPicker && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <Picker
            data={emojiData}
            onEmojiSelect={addEmoji}
            theme="light"
          />
        </div>
      )}

      <form onSubmit={submit} style={{ flex: 1, display: 'inline-flex', alignItems: 'center' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>
          Gửi
        </button>
      </form>
    </div>
  )
}