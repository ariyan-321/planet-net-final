import { useQuery } from '@tanstack/react-query';
import React, { useContext } from 'react'
import useAxiosSecure from './useAxiosSecure';
import { AuthContext } from '../providers/AuthProvider';

const useRole = () => {
    const axiosSecure=useAxiosSecure();
    const{user,loading}=useContext(AuthContext);
    
    const{data:role,isLoading}=useQuery({
        queryKey:["role",user?.email],
        queryFn:async()=>{
            const {data}=await axiosSecure.get(`users/role/${user?.email}`)
            return data.role;
        }
    })

    return [role,isLoading]
}


export default useRole