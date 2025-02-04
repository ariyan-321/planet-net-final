import PropTypes from 'prop-types'
import { useState } from 'react'
import DeleteModal from '../../Modal/DeleteModal'
import useAxiosSecure from '../../../hooks/useAxiosSecure'
import toast from 'react-hot-toast'
const SellerOrderDataRow = ({order,refetch,}) => {
  let [isOpen, setIsOpen] = useState(false)
  const closeModal = () => setIsOpen(false)

  const axiosSecure=useAxiosSecure();

  const handleDelete = async () => {
      try {
        const res = await axiosSecure.delete(`/orders/${order?._id}`);
        if (res.data.deletedCount > 0) {
          // Update plant quantity
          await axiosSecure.patch(`/plants/quantity/${order?.plantId}`, {
            quantityToUpdate: order?.quantity,
            status: "increase", // Ensure this matches backend logic
          });
          toast.success("Order Deleted Successfully")
          refetch();
        } else {
          toast.error("Order deletion failed.");
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 409) {
          toast.error("Order already delivered, cannot delete.");
        } else {
          toast.error("An error occurred during order deletion.");
        }
      } finally {
        closeModal();
      }
    
    };

    const handleStatusChange=async(newStatus)=>{
      if(order?.status===newStatus) return
      try{
        const res = await axiosSecure.patch(`/orders/${order?._id}`,{status:newStatus});
        console.log(res.data)
        if(res.data.modifiedCount>0){
          toast.success("Status Updated")
        }
      }
      catch(error){
        console.log(error.message)
      }
  
    }



  return (
    <tr>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{order?.name}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{order?.customer?.email}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>${order?.price}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{order?.quantity}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{order?.address}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{order?.status}</p>
      </td>

      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <div className='flex items-center gap-2'>
          <select
          onChange={(e)=> handleStatusChange(e.target.value)}
            required
            disabled={order?.status==="Delivered"}
            className='p-1 border-2 border-lime-300 focus:outline-lime-500 rounded-md text-gray-900 whitespace-no-wrap bg-white'
            name='category'
          >
            <option value='Pending'>Pending</option>
            <option value='In Progress'>Start Processing</option>
            <option value='Delivered'>Deliver</option>
          </select>
          <button
            onClick={() => setIsOpen(true)}
            className='relative disabled:cursor-not-allowed cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight'
          >
            <span
              aria-hidden='true'
              className='absolute inset-0 bg-red-200 opacity-50 rounded-full'
            ></span>
            <span className='relative'>Cancel</span>
          </button>
        </div>
        <DeleteModal handleDelete={()=>handleDelete()} isOpen={isOpen} closeModal={closeModal} />
      </td>
    </tr>
  )
}

SellerOrderDataRow.propTypes = {
  order: PropTypes.object,
  refetch: PropTypes.func,
}

export default SellerOrderDataRow
