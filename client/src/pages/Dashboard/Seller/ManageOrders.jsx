import { Helmet } from 'react-helmet-async'

import SellerOrderDataRow from '../../../components/Dashboard/TableRows/SellerOrderDataRow'
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useContext } from 'react';
import { AuthContext } from '../../../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { CgArrowLongRight } from 'react-icons/cg';
import toast from 'react-hot-toast';

const ManageOrders = () => {
  const{user}=useContext(AuthContext);

  const axiosSecure=useAxiosSecure();

  const{data:orders=[],isLoading,refetch}=useQuery({
    queryKey:["orders",user?.email],
    queryFn:async()=>{
      const {data}=await axiosSecure.get(`/seller-orders/${user?.email}`)
    return data;
    }


  });

  

  return (
    <>
      <Helmet>
        <title>Manage Orders</title>
      </Helmet>
      <div className='container mx-auto px-4 sm:px-8'>
        <div className='py-8'>
          <div className='-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto'>
            <div className='inline-block min-w-full shadow rounded-lg overflow-hidden'>
              <table className='min-w-full leading-normal'>
                <thead>
                  <tr>
                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Name
                    </th>
                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Customer
                    </th>
                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Price
                    </th>
                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Quantity
                    </th>
                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Address
                    </th>
                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Status
                    </th>

                    <th
                      scope='col'
                      className='px-5 py-3 bg-white  border-b border-gray-200 text-gray-800  text-left text-sm uppercase font-normal'
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {
                    orders.map((order,i)=> <SellerOrderDataRow  order={order} refetch={refetch} key={i} />)
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ManageOrders
