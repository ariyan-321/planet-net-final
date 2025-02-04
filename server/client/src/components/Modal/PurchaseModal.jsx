/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Fragment, useContext, useState } from "react";
import Button from "../Shared/Button/Button";
import { AuthContext } from "../../providers/AuthProvider";
import toast from "react-hot-toast";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useNavigate } from "react-router-dom";

const PurchaseModal = ({ closeModal, isOpen, plant ,refetch}) => {
  // Total Price Calculation

  const axiosSecure = useAxiosSecure();
  const navigate=useNavigate();

  const { _id, name, description, category, price, quantity, image, seller } =
    plant;

  const { user } = useContext(AuthContext);
  const [totalQuantity, setTotalQyantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(price);
  const [purchaseInfo, setPurchaseInfo] = useState({
    customer: {
      Cname: user?.displayName,
      Cimage: user?.photoURL,
      Cemail: user?.email,
    },
    plantId: _id,
    price: totalPrice,
    quantity: totalQuantity,
    seller: seller?.email,
    address: "",
    status: "Pending",
  });

  const handleQuantity = (value) => {
    if (value > quantity) {
      setTotalQyantity(quantity);
      return toast.error("Quantity Exceeds availavle stock");
    }
    if (value <= 0) {
      setTotalQyantity(1);
      return toast.error("Quantity cannot be less than 1");
    }
    setTotalQyantity(value);
    setTotalPrice(parseInt(value) * price);
    setPurchaseInfo((prev) => {
      return { ...prev, quantity: value, price: value * price };
    });
  };

  const handlePurchase = async () => {
    try {
      // Place order
      const res = await axiosSecure.post("/order", purchaseInfo);
      if (res.data.insertedId) {
        // Update plant quantity
        await axiosSecure.patch(`/plants/quantity/${_id}`, {
          quantityToUpdate: totalQuantity,
          status:"Decrease"
        });
  
        // Success message
        toast.success("Order Placed!");
        navigate("/dashboard/my-orders")
  
        // Refetch the data to update UI
        await refetch();
      }
    } catch (err) {
      // Error message
      toast.error(err.message);
    } finally {
      // Close the modal after all operations are complete
      closeModal();
    }
  };
  

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium text-center leading-6 text-gray-900"
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Plant: {name}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Category: {category}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Customer: {user?.displayName}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500">Price: $ {price}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Available Quantity: {quantity}
                  </p>
                </div>

                {/* quantity form */}

                <div className="space-y-1 mt-2 text-sm">
                  <label htmlFor="quantity" className=" text-gray-600">
                    Quantity:
                  </label>
                  <input
                    max={quantity}
                    value={totalQuantity}
                    onChange={(e) => handleQuantity(parseInt(e.target.value))}
                    className="mx-2 p-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="quantity"
                    id="quantity"
                    type="number"
                    placeholder="Enter the Quantity"
                    required
                  />
                </div>

                {/* adress form */}

                <div className="space-y-1 text-sm mt-2">
                  <label htmlFor="quantity" className=" text-gray-600">
                    Address:
                  </label>
                  <input
                    className="mx-2 p-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white"
                    name="address"
                    onChange={(e) =>
                      setPurchaseInfo((prev) => {
                        return { ...prev, address: e.target.value };
                      })
                    }
                    id="quantity"
                    type="text"
                    placeholder="Enter Shipping Adress"
                    required
                  />
                </div>

                <div className="mt-12">
                  <Button
                    onClick={() => handlePurchase()}
                    label={`Pay:${totalPrice || 0}$`}
                  ></Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseModal;
