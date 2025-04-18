import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  function createProject(e) {
    e.preventDefault();
    setIsLoading(true);

    axios.post('/projects/create', { 
      name: projectName 
    })
    .then((res) => {
      fetchProjects();
      setModalOpen(false);
      setProjectName('');
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }

  const fetchProjects = () => {
    setIsLoading(true);
    axios.get('/projects/all')
    .then((res) => {
      setProjects(res.data.projects);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchProjects();
    
    // Check user's preferred theme
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Theme classes
  const themeClasses = {
    mainBg: darkMode ? 'bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900',
    headerBg: darkMode ? 'bg-white/5 backdrop-blur-lg border-white/10 text-white' : 'bg-white/70 backdrop-blur-lg border-gray-200 text-gray-900',
    cardBg: darkMode ? 'bg-white/10 backdrop-blur-lg hover:bg-white/[0.15] text-white' : 'bg-white hover:bg-gray-50 text-gray-900',
    inputBg: darkMode ? 'bg-white/10 backdrop-blur-lg border-white/10 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500',
    buttonPrimary: 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25',
    buttonSecondary: darkMode ? 'bg-white/10 hover:bg-white/[0.15] text-white' : 'bg-white hover:bg-gray-50 text-gray-900',
    modalBg: darkMode ? 'bg-[#1E1B4B]/90 backdrop-blur-xl border border-white/10 text-white' : 'bg-white text-gray-900',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    newProjectCard: darkMode 
      ? 'bg-white/10 backdrop-blur-lg border-white/10 border-dashed hover:border-violet-500 text-white' 
      : 'bg-white border-gray-300 border-dashed hover:border-violet-500 text-gray-900',
    label: darkMode ? 'text-gray-200' : 'text-gray-700',
    subtext: darkMode ? 'text-gray-300' : 'text-gray-600'
  };

  const ProjectCard = ({ project }) => (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/project/`, { state: project })}
      className={`flex flex-col rounded-lg border ${themeClasses.border} ${themeClasses.cardBg} cursor-pointer`}
    >
      <div className="absolute top-2 right-2">
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="w-2 h-2 rounded-full bg-green-500"
        />
      </div>
      <div className="p-5 flex-grow">
        <div className="mb-2 flex items-center gap-3">
          <div className={`h-8 w-8 rounded-md flex items-center justify-center ${themeClasses.buttonPrimary}`}>
            <span className="text-white font-bold">{project.name[0].toUpperCase()}</span>
          </div>
          <h3 className="font-semibold text-lg truncate">{project.name}</h3>
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Last updated recently
        </div>
      </div>
      <div className={`px-5 py-3 border-t ${themeClasses.border} flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <i className="ri-group-line"></i>
          <span>{project.users.length} Collaborator{project.users.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex -space-x-2">
          {project.users.slice(0, 3).map((user, index) => (
            <div 
              key={user._id || index} 
              className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs"
              title={user.email}
            >
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
          ))}
          {project.users.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs">
              +{project.users.length - 3}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-t-2 border-violet-500 rounded-full"
    />
  );

  return (
    <div className={`min-h-screen ${themeClasses.mainBg}`}>
     
        <header className={`py-4 px-6 border-b ${themeClasses.border} ${themeClasses.headerBg}`}>
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
          <h1 className="text-xl font-bold flex flex-col">
            <span className='bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-400 text-4xl font-extrabold tracking-tight'>
              AI Developer
            </span>
            <span className="text-gray-400 font-medium">[Collaborative Platform]</span>
          </h1>
          <h2 className='ml-20 m-10 text-3xl font-extrabold'>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
              [ {user?.email.split('@')[0].toUpperCase()} ]
            </span>
          </h2>
            </div>
            <div className="flex items-center gap-4">
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
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500"
            >
              {darkMode ? (
                <i className="ri-sun-line"></i>
              ) : (
                <i className="ri-moon-line"></i>
              )}
            </button>
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-6">
        {/* Projects Header with Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and manage your AI development projects
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-4 py-2 rounded-md border ${themeClasses.border} ${themeClasses.inputBg} w-full sm:w-64`}
              />
              <i className={`ri-search-line absolute left-3 top-2.5 ${themeClasses.placeholder}`}></i>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className={`px-4 py-2 rounded-md ${themeClasses.buttonPrimary} text-white flex items-center justify-center gap-2`}
            >
              <i className="ri-add-line"></i>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className={`rounded-lg border ${themeClasses.border} p-8 text-center ${themeClasses.cardBg}`}>
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
              <i className="ri-folder-add-line text-2xl"></i>
            </div>
            <h3 className="text-xl font-medium mb-2">No projects yet</h3>
            <p className={`mb-6 max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first project to start collaborating on AI development with your team.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className={`px-4 py-2 rounded-md ${themeClasses.buttonPrimary} text-white`}
            >
              Create a Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && projects.length > 0 && (
          <>
            {filteredProjects.length === 0 ? (
              <div className={`rounded-lg border ${themeClasses.border} p-6 text-center ${themeClasses.cardBg}`}>
                <p>No projects match your search.</p>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {/* New Project Card */}
                  <div 
                    className={`flex flex-col justify-center items-center rounded-lg border ${themeClasses.newProjectCard} p-6 h-48 cursor-pointer transition-colors duration-200`}
                    onClick={() => setModalOpen(true)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
                      <i className="ri-add-line text-xl"></i>
                    </div>
                    <p className="font-medium">Create New Project</p>
                  </div>

                  {/* Project Cards */}
                  {filteredProjects.map((project) => (
                    <ProjectCard 
                      key={project._id}
                      project={project}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themeClasses.modalBg} p-6 rounded-lg w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Project</h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-2xl hover:opacity-75"
              >
                &times;
              </button>
            </div>
            <form onSubmit={createProject}>
              <div className="mb-4">
                <label className={`block mb-2 font-medium ${themeClasses.label}`}>Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My AI Project"
                  className={`w-full p-2 rounded-md border ${themeClasses.border} ${themeClasses.inputBg}`}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 rounded-md ${themeClasses.buttonSecondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!projectName.trim()}
                  className={`px-4 py-2 rounded-md ${themeClasses.buttonPrimary} text-white ${
                    !projectName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;