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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212]">
      <div className="w-full max-w-md px-8 pt-6 pb-8">
        <div className="text-center mb-8">
        <motion.h1
      className="text-2xl font-bold flex flex-col text-white mb-10"
      initial={{ opacity: 0.7, scale: 1 }}
      animate={focused ? { scale: 1.1, opacity: 1, textShadow: "0px 0px 5px rgba(59,130,246,0.9)" } : {}}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
    >
      <span className="text-blue-500 text-6xl mb-4">AI Developer </span>
      
        [Collaborative Platform]
     
    </motion.h1>
          <p className="mt-2 text-gray-200 text-lg">Sign in to your account</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2 text-sm font-medium" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2 text-sm font-medium" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 font-medium"
            >
              Sign In
            </button>
          </form>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login