import React, { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import {UserContext} from '../context/user.context'
import { motion } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { setUser } = useContext(UserContext)
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('/users/login',{
      email,
      password
    }).then((res)=>{
      console.log(res.data.user)
      localStorage.setItem('token',res.data.token)
      setUser(res.data.user)
      
      navigate('/')
    }).catch((err) => {
      console.log(err.response.data)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md px-8 pt-6 pb-8 relative">
        <div className="text-center mb-8">
          <motion.h1
            className="text-2xl font-bold flex flex-col text-white mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-400 text-6xl mb-4 font-extrabold tracking-tight">
              AI Developer
            </span>
            <span className="text-gray-400 font-medium">
              [Collaborative Platform]
            </span>
          </motion.h1>
          <p className="mt-2 text-gray-300 text-lg">Sign in to your account</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2 text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border border-white/10 transition duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border border-white/10 transition duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white py-3 rounded-lg transition duration-200 font-medium shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <i className="ri-arrow-right-line"></i>
            </button>
          </form>
          <p className="text-sm text-gray-400 mt-6 text-center">
            Don't have an account? 
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium ml-1 transition duration-200">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login