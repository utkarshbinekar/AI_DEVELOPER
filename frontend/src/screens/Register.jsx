import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('/users/register', {
      email,
      password
    }).then((res) => {
      console.log(res.data)
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      
      navigate('/')
    }).catch((err) => {
      console.log(err.response.data)
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1F2E]">
      <div className="w-full max-w-md px-8 pt-6 pb-8">
        <div className="text-center mb-8">
        <h1 className="text-2xl font-bold flex flex-col text-white mb-10"> <span className='text-blue-500 text-6xl'> AI Developer </span> [Collaborative Platform]</h1>
          <p className="mt-2 text-gray-200 text-lg ">Create your account</p>
        </div>

        <div className="bg-[#151923] p-8 rounded-lg shadow-lg w-full">
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
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white py-2 rounded transition duration-200 font-medium shadow-lg shadow-indigo-500/20"
            >
              Create Account
            </button>
          </form>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register