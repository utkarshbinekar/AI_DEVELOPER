import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from "../config/axios";
import { initializeSocket, recieveMessage, sendMessage } from '../config/socket';
import { UserContext } from '../context/user.context';
import Markdown from 'markdown-to-jsx';
import { debounce } from 'lodash'; // Import debounce from lodash
import Editor from "@monaco-editor/react";
import {getWebContainer} from "../config/webContainer"
import { motion } from "framer-motion";

// Create debounced send outside component to prevent recreation
const debouncedSend = debounce((message, user, setMessage, setMessages, messages, setIsSending, project) => {
  if (!user || !user._id || !message.trim()) {
    return;
  }

  setIsSending(true);

  const newMessage = {
    message,
    sender: { _id: user._id, email: user.email },
    timestamp: new Date().toISOString(),
  };

  setMessages(prev => [...prev, newMessage]);
  
  axios.put(`/projects/set-message/${project._id}`, { message })
    .then(() => {
      sendMessage('project-message', {
        message,
        sender: { _id: user._id, email: user.email },
      });
    })
    .catch(err => {
      console.log(err);
    })
    .finally(() => {
      setIsSending(false);
    });

  setMessage('');
}, 300);

export const Project = () => {
  const location = useLocation();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
   
  // Project state
  const [project, setProject] = useState(location.state);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]); // Store all messages
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // Add state to track sending status
  const [fileTree, setfileTree] = useState({})
  const [currentFile, setcurrentFile] = useState(null)
  const [openFiles, setopenFiles] = useState([])
  const [webContainer, setwebContainer] = useState(null)
  const [showIframe, setShowIframe] = useState(true);
  const [processStatus, setProcessStatus] = useState('idle'); // Add this state
  
  const [isIframeResizing, setIsIframeResizing] = useState(false);
  const [iframeWidth, setIframeWidth] = useState(400); // Add this near other state declarations



  // UI states
  const [darkMode, setDarkMode] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [activeSideTab, setActiveSideTab] = useState('chat'); // 'chat' or 'collaborators'
  const [sidebarWidth, setSidebarWidth] = useState(320); // Add this state
  const [isResizing, setIsResizing] = useState(false); // Add this state
  const [iframeUrl, setiframeUrl] = useState(null)


  const handleUserClick = (userId) => {
    setSelectedUserIds((prevSelectedUserIds) => {
      const newSelectedUserIds = new Set(prevSelectedUserIds);
      if (newSelectedUserIds.has(userId)) {
        newSelectedUserIds.delete(userId);
      } else {
        newSelectedUserIds.add(userId);
      }
      return newSelectedUserIds;
    });
  };


  
  const handleAddCollaborators = () => {
    axios.put('/projects/add-user', {
      projectId: project._id,
      users: Array.from(selectedUserIds)
    }).then(res => {
      // Refresh project data after adding collaborators
      fetchProjectData();
      setIsModalOpen(false);
    }).catch(err => {
      console.log(err);
    });
  };

  function WriteAiMessage(message) {
    try {
      const messageObject = JSON.parse(message);
      return (
        <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
          {messageObject.explanation && (
            <div className="mb-4 text-gray-300">
              <Markdown
                children={messageObject.text}
                options={{
                  overrideStyles: {
                    pre: {
                      backgroundColor: '#0d1117',
                      padding: '1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      color: '#e6edf3',
                      overflow: 'auto'
                    },
                    code: {
                      color: '#e6edf3',
                      backgroundColor: '#0d1117',
                      padding: '0.2em 0.4em',
                      borderRadius: '6px',
                      fontSize: '85%',
                      fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace'
                    }
                  }
                }}
              />
              {messageObject.explanation}
            </div>
          )}
          <Markdown
            children={messageObject.text}
            options={{
              overrideStyles: {
                pre: {
                  backgroundColor: '#0d1117',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  color: '#e6edf3',
                  overflow: 'auto'
                },
                code: {
                  color: '#e6edf3',
                  backgroundColor: '#0d1117',
                  padding: '0.2em 0.4em',
                  borderRadius: '6px',
                  fontSize: '85%',
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace'
                }
              }
            }}
          />
        </div>
      );
    } catch (err) {
      // If message is not JSON, display it as plain text
      return (
        <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
          <p>{message}</p>
        </div>
      );
    }
  }



  function send() {
    debouncedSend(message, user, setMessage, setMessages, messages, setIsSending, project);
  }

  const fetchProjectData = () => {
    axios.get(`/projects/get-project/${project._id}`).then(res => {
      setProject(res.data.project);
      setMessages(res.data.project.messages); 
      if (res.data.project.fileTree) {
        setfileTree(res.data.project.fileTree)
      }
    }).catch(err => {
      console.log(err);
    });
  };

function saveFileTree(ft){
  axios.put(`/projects/save-file-tree`, {
    projectId: project._id,
    fileTree: ft
  }).then(res => {
    console.log('File tree saved successfully');
    // Mount files after saving
    if (webContainer) {
      webContainer.mount(ft);
    }
  }).catch(err => {
    console.log(err);
  });
}

const deleteFile = async (fileName) => {
  try {
    // URL encode the fileName to handle special characters
    const encodedFileName = encodeURIComponent(fileName);
    
    await axios.delete('/projects/delete-file', {
      data: {
        projectId: project._id,
        fileName: fileName
      }
    });

    const newFileTree = { ...fileTree };
    delete newFileTree[fileName];
    setfileTree(newFileTree);
    
    // Remove from open files if it's open
    if (openFiles.includes(fileName)) {
      setopenFiles(openFiles.filter(f => f !== fileName));
      if (currentFile === fileName) {
        setcurrentFile(null);
      }
    }

    // Send update to other users
    sendMessage('project-message', JSON.stringify({ fileTree: newFileTree }));
    
  } catch (err) {
    console.error('Error deleting file:', err.response?.data || err.message);
  }
};

const runServer = async () => {
  if (processStatus === 'started') {
    // If already running, just show iframe
    setShowIframe(true);
    return;
  }

  setProcessStatus('starting');
  
  try {
    const runProcess = await webContainer.spawn("npm",["start"])
    runProcess.output.pipeTo(new WritableStream({
      write: (chunk) => {
        console.log(chunk);
      }
    }));

    // Reset status if process fails
    runProcess.exit.then((code) => {
      if (code !== 0) {
        setProcessStatus('idle');
      }
    });
  } catch (err) {
    console.error('Error running server:', err);
    setProcessStatus('idle');
  }
}

const setupProject = async () => {
  const defaultPackageJson = {
    name: project.name || 'project',
    version: '1.0.0',
    description: '',
    main: 'index.js',
    scripts: {
      start: 'http-server . -p 3000'
    },
    dependencies: {
      'http-server': '^14.1.1'
    }
  };

  try {
    await webContainer.fs.writeFile('package.json', JSON.stringify(defaultPackageJson, null, 2));
  } catch (err) {
    console.error('Error creating package.json:', err);
  }
};

const insttallPackages = async () => {
  // Don't do anything if process is already running
  if (processStatus === 'installing' || processStatus === 'starting') {
    return;
  }

  // If already started, just show iframe and return
  if (processStatus === 'started') {
    setShowIframe(true);
    return;
  }
  
  setProcessStatus('installing');
  
  try {
    await webContainer.mount(fileTree);
    
    // Create package.json first
    await setupProject();
    
    const installProcess = await webContainer.spawn("npm", ["install"]);
    
    installProcess.output.pipeTo(new WritableStream({
      write: (chunk) => {
        console.log(chunk);
      }
    }));

    // Wait for install to complete
    await installProcess.exit;
    
    // Only proceed with running server if install was successful
    await runServer();

  } catch (err) {
    console.error('Error installing packages:', err);
    setProcessStatus('idle');
  }
}

// Add this effect to handle server-ready event
useEffect(() => {
  if (webContainer) {
    webContainer.on("server-ready", (port, url) => {
      console.log(port, url);
      setiframeUrl(url);
      setShowIframe(true);
      setProcessStatus('started');
    });
  }
}, [webContainer]);

useEffect(() => {
  initializeSocket(project._id);

  if(!webContainer) {
    getWebContainer().then(container =>{
      setwebContainer(container)
      console.log("webContainer started successfully");
      
      if (Object.keys(fileTree).length > 0) {
        webContainer.mount(fileTree);
      }
    })
  }

  const messageHandler = data => {
    try {
      console.log(data.message);
      
      // Check if data.message is already an object
      const messageData = typeof data.message === 'string' 
        ? JSON.parse(data.message)
        : data.message;

      if (messageData.fileTree) {
        setfileTree(messageData.fileTree);
       
      }

      setMessages(prevMessages => {
        // Check if message already exists to prevent duplicates
        const isDuplicate = prevMessages.some(msg => 
          msg.message === data.message && 
          msg.sender._id === data.sender._id &&
          msg.timestamp === data.timestamp
        );
        
        if (isDuplicate) return prevMessages;
        
        return [...prevMessages, {
          message: data.message,
          sender: data.sender,
          timestamp: new Date().toISOString()
        }];
      });
    } catch (err) {
      // If JSON parsing fails, treat it as a regular message
      console.log('Regular message received:', data.message);
      setMessages(prevMessages => {
        const isDuplicate = prevMessages.some(msg => 
          msg.message === data.message && 
          msg.sender._id === data.sender._id &&
          msg.timestamp === data.timestamp
        );
        
        if (isDuplicate) return prevMessages;
        
        return [...prevMessages, {
          message: data.message,
          sender: data.sender,
          timestamp: new Date().toISOString()
        }];
      });
    }
  };

  recieveMessage('project-message', messageHandler);

  fetchProjectData();

  axios.get('/users/all').then(res => {
    setUsers(res.data.users);
  }).catch(err => {
    console.log(err);
  });

  // Cleanup function to remove socket listener
  return () => {
    // Assuming you have a way to remove socket listeners
    // If not, you'll need to implement this in your socket config
    recieveMessage('project-message', null);
  };
}, [project._id]);

  // Add new useEffect for fileTree changes
  useEffect(() => {
    if (webContainer && Object.keys(fileTree).length > 0) {
      webContainer.mount(fileTree);
    }
  }, [fileTree, webContainer]);
  
  // Add resize handlers for iframe
  const startIframeResizing = useCallback((mouseDownEvent) => {
    setIsIframeResizing(true);
    mouseDownEvent.preventDefault();
  }, []);

  const stopIframeResizing = useCallback(() => {
    setIsIframeResizing(false);
  }, []);

  const resizeIframe = useCallback(
    (mouseMoveEvent) => {
      if (isIframeResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          setIframeWidth(newWidth);
        }
      }
    },
    [isIframeResizing]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resizeIframe);
    window.addEventListener('mouseup', stopIframeResizing);
    return () => {
      window.removeEventListener('mousemove', resizeIframe);
      window.removeEventListener('mouseup', stopIframeResizing);
    };
  }, [resizeIframe, stopIframeResizing]);


  // Update themeClasses object
  const themeClasses = {
    mainBg: darkMode ? 'bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900',
    sidebarBg: darkMode ? 'bg-white/5 backdrop-blur-lg text-white' : 'bg-white/70 backdrop-blur-lg text-gray-900',
    headerBg: darkMode ? 'bg-white/5 backdrop-blur-lg border-white/10 text-white' : 'bg-white/70 backdrop-blur-lg border-gray-200 text-gray-900',
    cardBg: darkMode ? 'bg-white/10 backdrop-blur-lg text-white' : 'bg-white text-gray-900',
    inputBg: darkMode ? 'bg-white/10 backdrop-blur-lg border-white/10 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500',
    buttonPrimary: 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25',
    messageReceived: darkMode ? 'bg-white/10 backdrop-blur-lg text-white' : 'bg-gray-100 text-gray-900',
    messageSent: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white',
    modalBg: darkMode ? 'bg-[#1E1B4B]/90 backdrop-blur-xl border border-white/10 text-white' : 'bg-white text-gray-900',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    tabActive: darkMode ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-900',
    tabInactive: darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
    label: darkMode ? 'text-gray-200' : 'text-gray-700',
    placeholder: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode 
      ? 'bg-white/10 border-white/10 text-white focus:border-violet-500 placeholder-transparent' 
      : 'bg-white border-gray-200 text-gray-900 focus:border-violet-500 placeholder-transparent',
    floatingLabel: darkMode
      ? 'text-gray-400 peer-focus:text-violet-400 peer-placeholder-shown:text-gray-500'
      : 'text-gray-700 peer-focus:text-violet-600 peer-placeholder-shown:text-gray-500',
    chatBubble: darkMode
      ? 'bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg'
      : 'bg-white border border-gray-200 shadow-md'
  };

  const getTabStyle = (width) => {
    if (width < 300) {
      return 'px-2 py-2 text-xs flex flex-col items-center';
    }
    return 'px-2.5 py-2 flex items-center';
  };

  const startResizing = useCallback((mouseDownEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

   const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= 200 && newWidth <= 800) { // Min and max width limits
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleEditorDidMount = (editor, monaco) => {
    // You can store the editor instance if needed
    console.log("Editor mounted");
  };
  
  const handleEditorChange = (value, event) => {

    const ft = {
      ...fileTree,
      [currentFile]: {
        file: {
          contents: value
        }
      }
    }
    
    
    
    
    // Debounced save
    debounce(() => {
      setfileTree(ft);
      saveFileTree(ft)
    }, 1000)();
  };

  const getFileLanguage = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'md': 'markdown',
      'php': 'php',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'go': 'go',
      'rs': 'rust',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'bash': 'shell',
      'txt': 'plaintext'
    };
    
    return languageMap[extension] || 'plaintext';
  };

  const ChatInput = () => (
    <div className="relative">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={`peer w-full p-4 rounded-lg border ${themeClasses.input} transition-all`}
        placeholder=" "
        onKeyDown={(e) => e.key === 'Enter' && send()}
      />
      <label className={`absolute left-2 -top-2.5 px-1 text-sm transition-all ${themeClasses.floatingLabel} ${themeClasses.cardBg}`}>
        Message
      </label>
    </div>
  );

  const MessageBubble = ({ message, isSent }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${themeClasses.chatBubble} rounded-lg p-4 max-w-[80%] ${
        isSent ? 'ml-auto' : 'mr-auto'
      }`}
    >
      {message.sender._id === 'ai' ? (
        WriteAiMessage(message.message)
      ) : (
        <p className="text-sm h-min-[30vh] no-scrollbar">{message.message}</p>
      )}
      <small className="opacity-50 text-xs mt-1 self-end">
        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </small>
    </motion.div>
  );

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`h-screen w-screen flex ${themeClasses.mainBg}`}
    >
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar with updated styling */}
      <motion.section
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: sidebarWidth, minWidth: '350px', maxWidth: '800px' }}
        className={`left flex flex-col h-full ${themeClasses.sidebarBg} border-r ${themeClasses.border} relative`}
      >
        {/* Add resize handle */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 ${isResizing ? 'bg-blue-500' : ''}`}
          onMouseDown={startResizing}
        />
        
      {/* Project Header */}
        
        <header className={`flex items-center justify-between p-4 border-b ${themeClasses.border}`}>
          <div className="flex items-center">
          <button className='left mr-4 cursor-pointer' >
              <i className="ri-arrow-left-line text-xl" onClick={() => navigate(-1)}></i>
          </button>
            <div className={`h-8 w-8 rounded-md flex items-center justify-center ${themeClasses.buttonPrimary}`}>
              <span className="text-white font-bold">{project.name ? project.name[0].toUpperCase() : 'P'}</span>
            </div>
            <h1 className="ml-3 font-semibold truncate">{project.name || "Project"}</h1>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500"
            >
              {darkMode ? (
                <i className="ri-sun-line"></i>
              ) : (
                <i className="ri-moon-line"></i>
              )}
            </button>
          </div>
        </header>

        {/* Sidebar Tabs */}
        <div className="flex border-b px-2 pt-2 gap-4 text-sm font-medium">
          <button
            onClick={() => setActiveSideTab('chat')}
            className={`${getTabStyle(sidebarWidth)} rounded-t-md ${
              activeSideTab === 'chat' ? themeClasses.activeTab : themeClasses.inactiveTab
            }`}
          >
            <i className="ri-chat-3-line"></i>
            <span className={`${sidebarWidth < 300 ? 'text-[10px]' : 'ml-2'}`}>
              Chat
            </span>
          </button>
          <button
            onClick={() => setActiveSideTab('collaborators')}
            className={`${getTabStyle(sidebarWidth)} rounded-t-md ${
              activeSideTab === 'collaborators' ? themeClasses.activeTab : themeClasses.inactiveTab
            }`}
          >
            <i className="ri-group-line"></i>
            <span className={`${sidebarWidth < 300 ? 'text-[10px]' : 'ml-2'}`}>
              {sidebarWidth < 300 ? 'Collab' : 'Collaborators'}
            </span>
          </button>
          <button
            onClick={() => setActiveSideTab('Explorer')}
            className={`${getTabStyle(sidebarWidth)} rounded-t-md ${
              activeSideTab === 'Explorer' ? themeClasses.activeTab : themeClasses.inactiveTab
            }`}
          >
            <i className="ri-file-line"></i>
            <span className={`${sidebarWidth < 300 ? 'text-[10px]' : 'ml-2'}`}>
              {sidebarWidth < 300 ? 'Files' : 'Explorer'}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-hidden">
          {/* Chat Tab */}
                {activeSideTab === 'chat' && (
                <div className="h-full flex flex-col">
                  <div className="message-box p-3 flex-grow overflow-y-auto no-scrollbar flex flex-col-reverse gap-3">
                  <div className="flex-grow" /> {/* Spacer to push messages down */}
                  {messages.slice(0).reverse().map((msg, index) => (
                    <MessageBubble 
                      key={index} 
                      message={msg} 
                      isSent={msg.sender._id === user._id || msg.sender === user._id}
                    />
                  ))}
                  </div>
                  <div className="inputField p-3 mb-5 border-t">
                    <ChatInput />
                  </div>
                </div>
                )}

                {/* Collaborators Tab */}
          {activeSideTab === 'collaborators' && (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`w-full py-2 px-4 rounded-md ${themeClasses.buttonPrimary} text-white flex items-center justify-center gap-2`}
                >
                  <i className="ri-user-add-line"></i>
                  <span>Add Collaborator</span>
                </button>
              </div>
              <div className="collaborators overflow-y-auto p-2 flex flex-col gap-1">
                {project.users && project.users.map(collaborator => (
                  <div 
                    key={collaborator._id} 
                    className={`flex items-center gap-3 p-3 rounded-md ${themeClasses.hoverBg}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${collaborator._id === project.creator ? 'bg-purple-500' : 'bg-gray-500'} text-white`}>
                      {collaborator.email ? collaborator.email[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium truncate">{collaborator.email}</p>
                      <p className="text-xs opacity-75 truncate">
                        {collaborator._id === project.creator ? 'Owner' : 'Collaborator'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Explorer Tab */}
          {activeSideTab === 'Explorer' && (
            <div className="flex flex-col h-full">
             
            <div className="flex-grow overflow-y-auto p-2">
              {Object.entries(fileTree).map(([fileName, file]) => (
                <div 
                  key={fileName}
                  className={`flex items-center justify-between p-2 rounded-md ${themeClasses.hoverBg}`}
                >
                  <button 
                    onClick={() => {
                      setcurrentFile(fileName);
                      setopenFiles([...new Set([...openFiles, fileName])]);
                    }}
                    className="flex items-center gap-2 flex-grow overflow-hidden"
                  >
                    <i className="ri-file-code-line"></i>
                    <span className="truncate">{fileName}</span>
                  </button>
                  <button 
                    onClick={() => deleteFile(fileName)}
                    className="p-1 hover:text-red-500"
                    title="Delete file"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              ))}
            </div>

              </div>
              
            )}
        </div>
      </motion.section>

      {/* Main Content Area */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-grow h-full overflow-hidden flex flex-col relative"
      >
        {/* Header with gradient title */}
        <header className={`px-6 py-4 border-b ${themeClasses.headerBg} ${themeClasses.border}`}>
          <div className="flex justify-between items-center">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-xl font-bold flex flex-col"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-400 text-4xl font-extrabold tracking-tight">
                AI Developer
              </span>
              <span className="text-gray-400 font-medium">
                [Collaborative Platform]
              </span>
            </motion.h1>
            
            <div className="flex items-center gap-3">
              <button
              onClick={() =>{
                localStorage.removeItem("token");
                navigate("/login")
              }}
              className={`px-4 py-3 rounded-md bg-red-400 hover:bg-red-500 text-white flex items-center justify-center mr-5`}
            >
              <span>Logout</span>
            </button>
              <button
              onClick={() => insttallPackages()}
              className={`px-4 py-2 rounded-md ${themeClasses.buttonPrimary} text-white flex items-center gap-2`}
              disabled={processStatus === 'installing' || processStatus === 'starting'}
            >
              <i className={`ri-${processStatus === 'started'|| 'idle' ? 'play-fill' : 'loader-4-line animate-spin'} mr-1`}></i>
              <span>
                {processStatus === 'idle' && 'Run'}
                {processStatus === 'installing' && 'Installing...'}
                {processStatus === 'starting' && 'Starting...'}
                {processStatus === 'started' && 'Run'}
              </span>
            </button>
            </div>
          </div>
        </header>

        {/* Preview Toggle Button - Moved to bottom right */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowIframe(!showIframe)}
          className={`fixed bottom-6 right-6 z-50 px-4 py-2 rounded-md ${
            showIframe ? themeClasses.buttonPrimary : 'bg-gray-500'
          } text-white shadow-lg hover:shadow-xl transition-all duration-200`}
        >
          <i className={`ri-${showIframe ? 'code' : 'eye'}-line mr-1`}></i>
          <span>{showIframe ? 'Show Editor' : 'Show Preview'}</span>
        </motion.button>

        {/* Project Code Area */}
        <div className="flex-grow flex">
          {showIframe ? (
            // Iframe preview
            <div className="flex-grow flex flex-col bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={iframeUrl || ''}
                  onChange={(e) => setiframeUrl(e.target.value)}
                  className="flex-grow mr-2 px-2 py-1 text-sm border rounded"
                  placeholder="Enter URL"
                />
                <button
                  onClick={() => setShowIframe(false)}
                  className="p-1 hover:text-red-500"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
              <iframe
                src={iframeUrl}
                className="w-full flex-grow"
                title="Preview"
                sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation"
              />
            </div>
          ) : (
            // Code editor
            <div className="flex-grow flex flex-col">
              {currentFile ? (
                <>
                  {/* Open Files Tab Bar */}
                  <div className={`flex items-center gap-2 border-b ${themeClasses.border} ${themeClasses.headerBg}`}>
                    {openFiles.map((fileName, index) => (
                      <div
                        key={index}
                        onClick={() => setcurrentFile(fileName)}
                        className={`px-4 py-2 flex items-center gap-2 border-r ${themeClasses.border} ${
                          currentFile === fileName ? themeClasses.activeTab : ''
                        } cursor-pointer`}
                      >
                        <i className="ri-file-code-line"></i>
                        <span>{fileName}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setopenFiles(openFiles.filter(f => f !== fileName));
                            if (currentFile === fileName) {
                              setcurrentFile(null);
                            }
                          }}
                          className="ml-2 z-20 hover:text-red-500"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Code Editor */}
                  <div className={`flex-grow ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                    <Editor
                      height="100%"
                      defaultLanguage={getFileLanguage(currentFile)}
                      language={getFileLanguage(currentFile)}
                      theme={darkMode ? "vs-dark" : "light"}
                      value={fileTree[currentFile]?.file.contents || ''}
                      onChange={handleEditorChange}
                      onMount={handleEditorDidMount}
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: "on",
                        lineNumbers: "on",
                        folding: true,
                        autoClosingBrackets: "always",
                        autoClosingQuotes: "always",
                        formatOnPaste: true,
                        formatOnType: true,
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          useShadows: false,
                          verticalScrollbarSize: 10,
                          horizontalScrollbarSize: 10,
                          verticalHasArrows: false,
                          horizontalHasArrows: false,
                          arrowSize: 30,
                          alwaysConsumeMouseWheel: false
                        },
                        // Keep cursor within viewport
                        revealHorizontalRightPadding: 30,
                        stopRenderingLineAfter: -1,
                        fixedOverflowWidgets: true,
                        // ...rest of the options
                        suggest: {
                          preview: true,
                          showMethods: true,
                          showFunctions: true,
                          showConstructors: true,
                          showDeprecated: true,
                          showFields: true,
                          showVariables: true,
                          showClasses: true,
                          showStructs: true,
                          showInterfaces: true,
                          showModules: true,
                          showProperties: true,
                          showEvents: true,
                          showOperators: true,
                          showUnits: true,
                          showValues: true,
                          showConstants: true,
                          showEnums: true,
                          showEnumMembers: true,
                          showKeywords: true,
                          showWords: true,
                          showColors: true,
                          showFiles: true,
                          showReferences: true,
                          showFolders: true,
                          showTypeParameters: true,
                          showSnippets: true,
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="ri-file-code-line text-4xl mb-2"></i>
                    <p>Select a file from the explorer to start editing</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </motion.section>

      {/* Add Collaborator Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className={`${themeClasses.modalBg} p-6 rounded-lg w-96 max-w-full relative`}>
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Collaborators</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl hover:opacity-75">&times;</button>
            </header>
            <input
              type="text"
              placeholder="Search users..."
              className={`w-full p-2 mb-4 rounded-md border ${themeClasses.border} ${themeClasses.inputBg}`}
            />
            <div className="flex flex-col gap-1 max-h-80 overflow-auto mb-4">
              {users.map(user => (
                <div
                  key={user._id}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${
                    selectedUserIds.has(user._id) 
                      ? darkMode ? 'bg-gray-700' : 'bg-gray-200' 
                      : themeClasses.hoverBg
                  }`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-500 text-white">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                  <p className="font-medium flex-grow truncate">{user.email}</p>
                  {selectedUserIds.has(user._id) && (
                    <i className="ri-check-line text-blue-500"></i>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-md border ${themeClasses.border}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollaborators}
                disabled={selectedUserIds.size === 0}
                className={`px-4 py-2 rounded-md ${themeClasses.buttonPrimary} text-white ${
                  selectedUserIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Add Selected ({selectedUserIds.size})
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.main>
  );
};

export default Project;