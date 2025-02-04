import { Helmet } from 'react-helmet-async';
import AddPlantForm from '../../../components/Form/AddPlantForm';
import { imageUpload } from '../../../api/utils';
import { useContext, useState } from 'react';
import { AuthContext } from '../../../providers/AuthProvider';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import toast from 'react-hot-toast';

const AddPlant = () => {
  const { user } = useContext(AuthContext);
  const [uploadButtonText, setUploadButtonText] = useState("Upload image");
  const [loading, setLoading] = useState(false); // Fixed here
  const axiosSecure = useAxiosSecure();

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const description = form.description.value;
    const category = form.category.value;
    const price = form.price.value;
    const quantity = parseInt(form.quantity.value);
    const image = form.image.files[0];
    const imageURL = await imageUpload(image);

    const seller = {
      name: user?.displayName,
      image: user?.photoURL,
      email: user?.email,
    };

    const plantData = {
      name, description, category, price, quantity, image: imageURL, seller,
    };

    try {
      await axiosSecure.post("/plants", plantData);
      toast.success("Data added");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Add Plant | Dashboard</title>
      </Helmet>

      <AddPlantForm
        loading={loading}
        uploadButtonText={uploadButtonText}
        setUploadButtonText={setUploadButtonText}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

export default AddPlant;
