import React from 'react'

const chat = () => {
  return (
    <div className="h-full flex flex-col">
              <div className="message-box p-3 flex-grow overflow-y-auto flex flex-col gap-3">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`message max-w-64 flex flex-col p-3 rounded-lg ${
                      msg.sender._id === user._id 
                        ? `${themeClasses.messageSent} text-white ml-auto` 
                        : `${themeClasses.messageReceived} mr-auto`
                    }`}
                  >
                    <small className="opacity-75 text-xs mb-1">{
                      msg.sender._id === user._id ? 'You' : (user?.email.split('@')[0].toUpperCase() || 'User')
                    }</small>
                    <p className="text-sm">{msg.message}</p>
                    <small className="opacity-50 text-xs mt-1 self-end">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </small>
                  </div>
                ))}
              </div>
              <div className="inputField p-3 mb-5 border-t">
                <div className={`flex rounded-md border ${themeClasses.border} overflow-hidden`}>
                  <input
                    
                    onChange={(e) => setMessage(e.target.value)}
                    className={`p-2 px-4 w-full outline-none ${themeClasses.inputBg}`}
                    type="text" 
                    placeholder="Type your message..." 
                    onKeyDown={(e) => e.key === 'Enter' && message.trim() && send()}
                  />
                  <button
                    onClick={send}
                    
                    disabled={!message.trim()}
                    className={`px-4 ${themeClasses.buttonPrimary} text-white`}
                  >
                    <i className="ri-send-plane-fill"></i>
                  </button>
                </div>
              </div>
            </div>
  )
}

export default chat