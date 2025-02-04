import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import LoadingSpinner from '../components/Shared/LoadingSpinner'
import useRole from '../hooks/useRole'

 const SellerRoute = ({children}) => {

    const[role,isloading]=useRole();
    const location = useLocation()
  
    if (isloading) return <LoadingSpinner />
    if (role==="seller") return children


    return <Navigate to='/dashboard'  replace='true' />
  
}

export default SellerRoute
